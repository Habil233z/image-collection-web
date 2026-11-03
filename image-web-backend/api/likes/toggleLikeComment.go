package likes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (d *Database) ToggleLikeComment(c *gin.Context) {
	commentIdStr := c.Param("commentId")
	commentId, err := strconv.Atoi(commentIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	token, userExists := c.Get("auth_token")
	if !userExists {
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

	var existsQuery bool
	err = d.DB.Pool.QueryRow(c, "SELECT EXISTS(SELECT 1 FROM likes_comment WHERE user_id = $1 AND comment_id = $2)", userId, commentId).Scan(&existsQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if existsQuery {
		_, err = d.DB.Pool.Exec(c, "DELETE FROM likes_comment WHERE user_id = $1 AND comment_id = $2", userId, commentId)
	} else {
		_, err = d.DB.Pool.Exec(c, "INSERT INTO likes_comment (user_id, comment_id) VALUES ($1, $2)", userId, commentId)
	}

	var likeCount int
	err = d.DB.Pool.QueryRow(c, "SELECT COUNT(*) FROM likes_comment WHERE comment_id = $1", commentId).Scan(&likeCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch like count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Liked successfully"})
}
