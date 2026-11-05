package replys

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
)

type EditReplyInput struct {
	EditReplyText string `json:"editReplyText"`
}

func (d *Database) EditReply(c *gin.Context) {
	replyParamId := c.Param("replyId")
	replyId, err := strconv.Atoi(replyParamId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reply ID format"})
		return
	}

	var input EditReplyInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: reply text is required"})
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
	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT user_id FROM comment_replies WHERE id = $1", replyId).Scan(&ownerId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Reply not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	if ownerId != userId {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: You do not own this reply"})
		return
	}

	_, err = d.DB.Pool.Exec(c.Request.Context(), "UPDATE comment_replies SET reply = $1 WHERE id = $2", input.EditReplyText, replyId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update reply in database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Reply updated successfully",
	})
}
