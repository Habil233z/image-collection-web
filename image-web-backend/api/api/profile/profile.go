package profile

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func Profile(c *gin.Context) {
	// Retrieve user data stored in the context by the AuthMiddleware
	token, exists := c.Get("auth_token")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: User data not found"})
		return
	}

	// Cast the user data back to jwt.MapClaims
	claims, ok := token.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user claims"})
		return
	}

	// Respond with id, email, and username
	c.JSON(http.StatusOK, gin.H{
		"message": "Profile fetched successfully",
		"data": gin.H{
			"id":       claims["id"],
			"email":    claims["email"],
			"username": claims["username"],
		},
	})
}
