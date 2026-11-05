package likes

import (
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (d *Database) GetLikeComment(c *gin.Context) {
	commentIdStr := c.Param("commentId")
	commentId, err := strconv.Atoi(commentIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	var userId int
	if tokenString, err := c.Cookie("image-web-auth_token"); err == nil && tokenString != "" {
		secretKey := []byte(os.Getenv("SECRET_KEY"))

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return secretKey, nil
		})

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

	var isLiked bool
	err = d.DB.Pool.QueryRow(c, "SELECT EXISTS(SELECT 1 FROM likes_comment WHERE user_id = $1 AND comment_id = $2)", userId, commentId).Scan(&isLiked)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	var count int
	err = d.DB.Pool.QueryRow(c, "SELECT COUNT(*) FROM likes_comment WHERE comment_id = $1", commentId).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch like count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"isLiked":   isLiked,
		"likeCount": count,
	})
}
