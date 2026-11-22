package chat

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
)

func (d *Database) GetMessages(c *gin.Context) {
	partnerId, err := strconv.Atoi(c.Param("userId"))
	if err != nil || partnerId < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

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

	if partnerId == userId {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You can't chat with yourself"})
		return
	}

	var partner Partner
	err = d.DB.Pool.QueryRow(c.Request.Context(),
		"SELECT id, username, COALESCE(avatar_url, '') FROM users WHERE id = $1", partnerId).
		Scan(&partner.ID, &partner.Username, &partner.AvatarURL)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		log.Printf("[ERROR] chat partner lookup failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	if _, err := d.DB.Pool.Exec(c.Request.Context(),
		"UPDATE messages SET read_at = NOW() WHERE sender_id = $1 AND receiver_id = $2 AND read_at IS NULL",
		partnerId, userId); err != nil {
		log.Printf("[ERROR] mark read failed: %v", err)
	}

	rows, err := d.DB.Pool.Query(c.Request.Context(), `
		SELECT id, sender_id, body, created_at, edited_at, read_at IS NOT NULL
		FROM (
			SELECT id, sender_id, body, created_at, edited_at, read_at
			FROM messages
			WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
			ORDER BY id DESC
			LIMIT $3
		) newest
		ORDER BY id ASC`, userId, partnerId, messageWindow)
	if err != nil {
		log.Printf("[ERROR] messages query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}
	defer rows.Close()

	messages := []Message{}
	for rows.Next() {
		var msg Message
		if err := rows.Scan(&msg.ID, &msg.SenderID, &msg.Body, &msg.CreatedAt, &msg.EditedAt, &msg.Read); err != nil {
			log.Printf("[ERROR] messages scan failed: %v", err)
			continue
		}
		msg.Mine = msg.SenderID == userId
		messages = append(messages, msg)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    messages,
		"partner": partner,
	})
}
