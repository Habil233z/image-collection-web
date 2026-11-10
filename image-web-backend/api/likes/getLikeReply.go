package likes

import (
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (d *Database) GetLikeReply(c *gin.Context) {
	replyIdStr := c.Param("replyId")
	replyId, err := strconv.Atoi(replyIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reply ID format"})
		return
	}

	var userId int
	var isLiked bool

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

	var likeCount int
	// FIXED: Changed from likes_reply to the unified likes table
	err = d.DB.Pool.QueryRow(
		c.Request.Context(),
		"SELECT COUNT(*) FROM likes WHERE reply_id = $1",
		replyId,
	).Scan(&likeCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch like count"})
		return
	}

	if userId > 0 {
		// FIXED: Changed to unified likes table and added null checks for image_id and comment_id
		err = d.DB.Pool.QueryRow(
			c.Request.Context(),
			"SELECT EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND reply_id = $2 AND image_id IS NULL AND comment_id IS NULL)",
			userId,
			replyId,
		).Scan(&isLiked)
		if err != nil {
			isLiked = false
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Reply likes fetched successfully",
		"likeCount": likeCount,
		"isLiked":   isLiked,
	})
}
