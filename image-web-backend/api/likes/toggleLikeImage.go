package likes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (d *Database) ToggleLike(c *gin.Context) {
	imageIDStr := c.Param("id")
	imageID, err := strconv.Atoi(imageIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
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

	// Check if already liked
	var existingID int
	checkQuery := `SELECT id FROM likes WHERE user_id = $1 AND image_id = $2 AND comment_id IS NULL AND reply_id IS NULL`
	err = d.DB.Pool.QueryRow(c.Request.Context(), checkQuery, userID, imageID).Scan(&existingID)

	if err == nil {
		// Unlike
		_, err = d.DB.Pool.Exec(c.Request.Context(), `DELETE FROM likes WHERE id = $1`, existingID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlike image"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Unliked successfully", "liked": false})
		return
	}

	// Like
	insertQuery := `INSERT INTO likes (user_id, image_id) VALUES ($1, $2)`
	_, err = d.DB.Pool.Exec(c.Request.Context(), insertQuery, userID, imageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to like image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Liked successfully", "liked": true})
}
