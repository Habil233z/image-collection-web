package social

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
)

func (d *Database) Follow(c *gin.Context) {
	targetId, err := strconv.Atoi(c.Param("id"))
	if err != nil || targetId < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
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
	userId := int(idFloat)

	if userId == targetId {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You can't follow yourself"})
		return
	}

	var existingId int
	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT id FROM users WHERE id = $1", targetId).Scan(&existingId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		log.Printf("[ERROR] Follow target lookup failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	_, err = d.DB.Pool.Exec(c.Request.Context(), "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", userId, targetId)
	if err != nil {
		log.Printf("[ERROR] Follow failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to follow user"})
		return
	}

	var followerCount int
	if err := d.DB.Pool.QueryRow(c.Request.Context(), "SELECT COUNT(*) FROM follows WHERE following_id = $1", targetId).Scan(&followerCount); err != nil {
		log.Printf("[ERROR] follower count failed: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"is_following":   true,
		"follower_count": followerCount,
	})
}
