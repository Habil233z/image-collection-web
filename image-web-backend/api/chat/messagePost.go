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

func (d *Database) SendMessage(c *gin.Context) {
	partnerId, err := strconv.Atoi(c.Param("userId"))
	if err != nil || partnerId < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
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

	if partnerId == userId {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You can't chat with yourself"})
		return
	}

	var existingId int
	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT id FROM users WHERE id = $1", partnerId).Scan(&existingId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		log.Printf("[ERROR] chat partner lookup failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	msg := Message{SenderID: userId, Body: body, Mine: true}
	err = d.DB.Pool.QueryRow(c.Request.Context(),
		"INSERT INTO messages (sender_id, receiver_id, body) VALUES ($1, $2, $3) RETURNING id, created_at",
		userId, partnerId, body).Scan(&msg.ID, &msg.CreatedAt)
	if err != nil {
		log.Printf("[ERROR] send message failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    msg,
	})
}
