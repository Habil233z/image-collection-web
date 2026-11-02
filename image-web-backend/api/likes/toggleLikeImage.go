package likes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (d *Database) ToggleLike(c *gin.Context) {
	paramsId := c.Param("id")
	imageId, err := strconv.Atoi(paramsId)

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

	var exists bool
	err = d.DB.Pool.QueryRow(c, "SELECT EXISTS(SELECT 1 FROM likes_image WHERE user_id = $1 AND image_id = $2)", &userId, &imageId).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database query error"})
		return
	}

	if exists {
		_, err = d.DB.Pool.Exec(c.Request.Context(), "DELETE FROM likes_image WHERE user_id = $1 AND image_id = $2", userId, imageId)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlike image"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Unliked successfully", "isLiked": false})
	} else {
		_, err = d.DB.Pool.Exec(c.Request.Context(), "INSERT INTO likes_image (user_id, image_id) VALUES ($1, $2)", userId, imageId)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to like image"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Liked successfully", "isLiked": true})
	}
}
