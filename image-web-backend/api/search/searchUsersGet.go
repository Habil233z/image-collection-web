package search

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func (d *Database) SearchUsers(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	offset := (page - 1) * userPageSize

	q := strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(c.Query("q")), "@"))
	if q == "" {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": []UserResult{}, "page_size": userPageSize})
		return
	}

	rows, err := d.DB.Pool.Query(c.Request.Context(), `
		SELECT
			users.id,
			users.username,
			COALESCE(users.avatar_url, ''),
			(SELECT COUNT(*) FROM follows WHERE following_id = users.id)
		FROM users
		WHERE users.username ILIKE $1
		ORDER BY (users.username ILIKE $2) DESC, 4 DESC, users.username ASC
		LIMIT $3 OFFSET $4`,
		"%"+escapeLike(q)+"%", escapeLike(q)+"%", userPageSize, offset)
	if err != nil {
		log.Printf("[ERROR] User search failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}
	defer rows.Close()

	results := []UserResult{}
	for rows.Next() {
		var u UserResult
		if err := rows.Scan(&u.ID, &u.Username, &u.AvatarURL, &u.FollowerCount); err != nil {
			log.Printf("[ERROR] Failed to scan user search row: %v", err)
			continue
		}
		results = append(results, u)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      results,
		"page_size": userPageSize,
	})
}
