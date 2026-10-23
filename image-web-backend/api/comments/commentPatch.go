package comments

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
)

type EditCommentInput struct {
	EditCommentText string `json:"editCommentText"`
}

func (d *Database) EditComment(c *gin.Context) {
	commentParamId := c.Param("commentId")
	commentId, err := strconv.Atoi(commentParamId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID format"})
		return
	}

	var input EditCommentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: comment text is required"})
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
	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT user_id FROM image_comments WHERE id = $1", commentId).Scan(&ownerId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	if ownerId != userId {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: You do not own this comment"})
		return
	}

	_, err = d.DB.Pool.Exec(c.Request.Context(), "UPDATE image_comments SET comment = $1 WHERE id = $2", input.EditCommentText, commentId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comment in database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Comment updated successfully",
	})
}
