package profile

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strconv" // 1. Import strconv

	"image-web-backend/resources/database"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Database struct {
	DB *database.Postgres
}

type user struct {
	Email    string `json:"email"`
	Username string `json:"username"`
}

func (h *Database) Profile(c *gin.Context) {
	var user user
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

	idString, ok := claims["id"].(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID claim type"})
		return
	}

	userId, err := strconv.Atoi(idString)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert user ID to int"})
		return
	}

	err = h.DB.Pool.QueryRow(context.Background(), "SELECT id, email, username FROM users WHERE id = $1", userId).Scan(&user.Email, &user.Username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Rows not found",
				"message": "User doesn't exist",
			})
			return
		}

		println("[Profile Error] DB Query failed:", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile fetched successfully",
		"data":    user,
	})
}
