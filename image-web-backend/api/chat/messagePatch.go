package chat

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
)

func (d *Database) EditMessage(c *gin.Context) {
	messageId, err := strconv.Atoi(c.Param("messageId"))
	if err != nil || messageId < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	var input MessageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: message text is required"})
		return
	}
	body := strings.TrimSpace(input.Body)
	if body == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message can't be empty"})
		return
	}
	if utf8.RuneCountInString(body) > maxBodyRunes {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message is too long (max 2000 characters)"})
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

	var ownerId int
	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT sender_id FROM messages WHERE id = $1", messageId).Scan(&ownerId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
			return
		}
		log.Printf("[ERROR] message lookup failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	if ownerId != userId {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: You do not own this message"})
		return
	}

	msg := Message{ID: messageId, SenderID: userId, Mine: true}
	err = d.DB.Pool.QueryRow(c.Request.Context(), `
		UPDATE messages SET body = $1, edited_at = NOW()
		WHERE id = $2
		RETURNING body, created_at, edited_at, read_at IS NOT NULL`,
		body, messageId).Scan(&msg.Body, &msg.CreatedAt, &msg.EditedAt, &msg.Read)
	if err != nil {
		log.Printf("[ERROR] edit message failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to edit message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    msg,
	})
}
