package authMiddleware

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		secretKey := []byte(os.Getenv("SECRET_KEY"))
		tokenString, err := c.Cookie("image-web-auth_token")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Access denied, No cookie with token"})
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("Algorithm undefined: %v", token.Header["alg"])
			}
			return secretKey, nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or Expired token"})
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			c.Set("auth_token", claims)
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Fail to extract token from cookie"})
			return
		}
		c.Next()
	}
}

func parseToken(c *gin.Context) (jwt.MapClaims, bool) {
	tokenString, err := c.Cookie("image-web-auth_token")
	if err != nil {
		return nil, false
	}
	secretKey := []byte(os.Getenv("SECRET_KEY"))
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Algorithm undefined: %v", token.Header["alg"])
		}
		return secretKey, nil
	})
	if err != nil || !token.Valid {
		return nil, false
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	return claims, ok
}

func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		if claims, ok := parseToken(c); ok {
			c.Set("auth_token", claims)
		}
		c.Next()
	}
}
