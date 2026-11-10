package likes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (d *Database) ToggleLikeReply(c *gin.Context) {
	replyIDStr := c.Param("replyId")
	replyID, err := strconv.Atoi(replyIDStr)
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
	userID := int(idFloat)

	var existingID int
	checkQuery := `SELECT id FROM likes WHERE user_id = $1 AND reply_id = $2 AND image_id IS NULL AND comment_id IS NULL`
	err = d.DB.Pool.QueryRow(c.Request.Context(), checkQuery, userID, replyID).Scan(&existingID)

	if err == nil {
		_, err = d.DB.Pool.Exec(c.Request.Context(), `DELETE FROM likes WHERE id = $1`, existingID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlike reply"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Unliked reply successfully", "liked": false})
		return
	}

	insertQuery := `INSERT INTO likes (user_id, reply_id) VALUES ($1, $2)`
	_, err = d.DB.Pool.Exec(c.Request.Context(), insertQuery, userID, replyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to like reply"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Liked reply successfully", "liked": true})
}
