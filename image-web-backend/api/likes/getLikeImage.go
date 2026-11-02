package likes

import (
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (d *Database) GetLikeImage(c *gin.Context) {
	paramsId := c.Param("id")
	imageId, err := strconv.Atoi(paramsId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID format"})
		return
	}

	var userId int
	var isLiked bool

	// Try reading and validating the cookie inline
	if tokenString, err := c.Cookie("image-web-auth_token"); err == nil && tokenString != "" {
		secretKey := []byte(os.Getenv("SECRET_KEY"))

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return secretKey, nil
		})

		// If token is valid, extract claims and assign to userId
		if err == nil && token != nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				switch idVal := claims["id"]; value := idVal.(type) {
				case float64:
					userId = int(value)
				case int:
					userId = value
				case string:
					if parsedId, parseErr := strconv.Atoi(value); parseErr == nil {
						userId = parsedId
					}
				}
			}
		}
	}

	// Fetch total like count for the image
	var count int
	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT COUNT(*) FROM likes_image WHERE image_id = $1", imageId).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch count"})
		return
	}

	// If userId was successfully extracted from the cookie, check if they liked it
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
