package replys

import (
	"log"
	"net/http"
	"time" // 1. Import time package

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (d *Database) PostReply(c *gin.Context) {
	commentID := c.Param("commentId")

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
	userID := int(idFloat)

	var input struct {
		Reply string `json:"reply"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	query := `INSERT INTO replies (comment_id, user_id, reply) VALUES ($1, $2, $3) RETURNING id, created_at`

	var replyID int64       // Changed from int to int64 to match Postgres BIGINT
	var createdAt time.Time // Changed from string to time.Time

	err := d.DB.Pool.QueryRow(c.Request.Context(), query, commentID, userID, input.Reply).Scan(&replyID, &createdAt)
	if err != nil {
		// Log the exact error to your terminal for debugging
		log.Printf("[ERROR] Failed to post reply scan: %v", err)

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to post reply"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Reply posted successfully",
		"reply_id":   replyID,
		"created_at": createdAt, // Gin automatically formats time.Time to ISO string
	})
}
