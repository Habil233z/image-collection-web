package replys

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type ReplyInput struct {
	Reply string `json:"reply"`
}

func (d *Database) PostReply(c *gin.Context) {
	var reply ReplyInput

	if err := c.BindJSON(&reply); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	commentIdStr := c.Param("commentId")
	commentId, err := strconv.Atoi(commentIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
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

	_, err = d.DB.Pool.Exec(c.Request.Context(), "INSERT INTO comment_replies (comment_id, user_id, reply, created_at) VALUES ($1, $2, $3, NOW())", commentId, userId, reply.Reply)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create reply"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Reply created successfully",
	})
}
