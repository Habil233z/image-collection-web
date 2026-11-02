package likes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (d *Database) GetLikeImage(c *gin.Context) {
	paramsId := c.Param("id")
	imageId, err := strconv.Atoi(paramsId)

	var userId int
	var isLiked bool

	if token, userExists := c.Get("auth_token"); userExists {
		if claims, ok := token.(jwt.MapClaims); ok {
			if idFloat, ok := claims["id"].(float64); ok {
				userId = int(idFloat)
			}
		}
	}

	var count int
	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT COUNT(*) FROM likes_image WHERE image_id = $1", imageId).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch count"})
		return
	}

	if userId > 0 {
		err = d.DB.Pool.QueryRow(
			c.Request.Context(),
			"SELECT EXISTS(SELECT 1 FROM likes_image WHERE user_id = $1 AND image_id = $2)",
			userId,
			imageId,
		).Scan(&isLiked)
		if err != nil {
			isLiked = false
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"likeCount": count,
		"isLiked":   isLiked,
	})
}
