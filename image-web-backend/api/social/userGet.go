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

func (d *Database) GetUser(c *gin.Context) {
	userId, err := strconv.Atoi(c.Param("id"))
	if err != nil || userId < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var profile UserProfile
	err = d.DB.Pool.QueryRow(c.Request.Context(), `
		SELECT
			users.id,
			users.username,
			COALESCE(users.avatar_url, ''),
			(SELECT COUNT(*) FROM images  WHERE user_id = users.id),
			(SELECT COUNT(*) FROM follows WHERE following_id = users.id),
			(SELECT COUNT(*) FROM follows WHERE follower_id = users.id)
		FROM users
		WHERE users.id = $1`, userId).
		Scan(&profile.ID, &profile.Username, &profile.AvatarURL, &profile.ImageCount, &profile.FollowerCount, &profile.FollowingCount)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		log.Printf("[ERROR] GetUser query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	if token, exists := c.Get("auth_token"); exists {
		if claims, ok := token.(jwt.MapClaims); ok {
			if idFloat, ok := claims["id"].(float64); ok {
				viewerId := int(idFloat)
				profile.IsMe = viewerId == profile.ID
				if !profile.IsMe {
					err := d.DB.Pool.QueryRow(c.Request.Context(), `
						SELECT
							EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2),
							EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = $1)`,
						viewerId, profile.ID).Scan(&profile.IsFollowing, &profile.IsFollowedBy)
					if err != nil {
						log.Printf("[ERROR] GetUser follow state failed: %v", err)
					}
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    profile,
	})
}
