package social

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (d *Database) GetFollowers(c *gin.Context) {
	userId, err := strconv.Atoi(c.Param("id"))
	if err != nil || userId < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	offset := (page - 1) * userPageSize

	rows, err := d.DB.Pool.Query(c.Request.Context(), `
		SELECT users.id, users.username, COALESCE(users.avatar_url, '')
		FROM follows
		JOIN users ON users.id = follows.follower_id
		WHERE follows.following_id = $1
		ORDER BY follows.created_at DESC, users.id DESC
		LIMIT $2 OFFSET $3`, userId, userPageSize, offset)
	if err != nil {
		log.Printf("[ERROR] GetFollowers query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	defer rows.Close()

	users := []UserSummary{}
	for rows.Next() {
		var u UserSummary
		if err := rows.Scan(&u.ID, &u.Username, &u.AvatarURL); err != nil {
			log.Printf("[ERROR] GetFollowers scan failed: %v", err)
			continue
		}
		users = append(users, u)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      users,
		"page_size": userPageSize,
	})
}
