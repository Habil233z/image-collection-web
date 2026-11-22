package chat

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (d *Database) GetConversations(c *gin.Context) {
	token, exists := c.Get("auth_token")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: User data not found"})
		return
	}

	claims, ok := token.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user claims"})
		return
	}

	idFloat, ok := claims["id"].(float64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID claim type"})
		return
	}
	userId := int(idFloat)

	rows, err := d.DB.Pool.Query(c.Request.Context(), `
		SELECT
			users.id, users.username, COALESCE(users.avatar_url, ''),
			latest.body, latest.sender_id, latest.created_at,
			(SELECT COUNT(*) FROM messages unread
				WHERE unread.sender_id = users.id AND unread.receiver_id = $1 AND unread.read_at IS NULL)
		FROM (
			SELECT DISTINCT ON (partner_id) partner_id, id, body, sender_id, created_at
			FROM (
				SELECT CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS partner_id,
					id, body, sender_id, created_at
				FROM messages
				WHERE sender_id = $1 OR receiver_id = $1
			) pairs
			ORDER BY partner_id, id DESC
		) latest
		JOIN users ON users.id = latest.partner_id
		ORDER BY latest.id DESC`, userId)
	if err != nil {
		log.Printf("[ERROR] conversations query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch conversations"})
		return
	}
	defer rows.Close()

	conversations := []Conversation{}
	for rows.Next() {
		var conv Conversation
		var senderId int
		if err := rows.Scan(&conv.Partner.ID, &conv.Partner.Username, &conv.Partner.AvatarURL,
			&conv.LastMessage, &senderId, &conv.LastAt, &conv.Unread); err != nil {
			log.Printf("[ERROR] conversations scan failed: %v", err)
			continue
		}
		conv.LastMine = senderId == userId
		conversations = append(conversations, conv)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    conversations,
	})
}
