package likes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (d *Database) ToggleLikeReply(c *gin.Context) {
	replyIdStr := c.Param("replyId")
	replyId, err := strconv.Atoi(replyIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reply ID"})
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

	var existingId int
	err = d.DB.Pool.QueryRow(
		c.Request.Context(),
		"SELECT id FROM likes_reply WHERE reply_id = $1 AND user_id = $2",
		replyId, userId,
	).Scan(&existingId)

	if err == nil {
		_, err = d.DB.Pool.Exec(
			c.Request.Context(),
			"DELETE FROM likes_reply WHERE reply_id = $1 AND user_id = $2",
			replyId, userId,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlike reply"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Reply unliked successfully", "liked": false})
		return
	}

	_, err = d.DB.Pool.Exec(
		c.Request.Context(),
		"INSERT INTO likes_reply (reply_id, user_id, created_at) VALUES ($1, $2, NOW())",
		replyId, userId,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to like reply"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reply liked successfully", "liked": true})
}
