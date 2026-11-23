package search

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func (d *Database) SearchImages(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	offset := (page - 1) * imagePageSize

	q := strings.TrimSpace(c.Query("q"))
	tag := normalizeTag(c.Query("tag"))

	// "#sunset" in the search box means the tag "sunset"
	if strings.HasPrefix(q, "#") {
		if tag == "" {
			tag = normalizeTag(q)
		}
		q = ""
	}

	if q == "" && tag == "" {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": []ImageResult{}, "page_size": imagePageSize})
		return
	}

	conditions := []string{}
	args := []any{}

	if tag != "" {
		args = append(args, tag)
		conditions = append(conditions, "images.tags @> ARRAY[$"+strconv.Itoa(len(args))+"]::text[]")
	}
	if q != "" {
		args = append(args, "%"+escapeLike(q)+"%")
		titleArg := strconv.Itoa(len(args))
		args = append(args, normalizeTag(q))
		tagArg := strconv.Itoa(len(args))
		conditions = append(conditions, "(images.title ILIKE $"+titleArg+" OR images.tags @> ARRAY[$"+tagArg+"]::text[])")
	}

	args = append(args, imagePageSize, offset)
	limitArg := strconv.Itoa(len(args) - 1)
	offsetArg := strconv.Itoa(len(args))

	query := `SELECT
		images.id,
		images.user_id,
		images.title,
		images.image_url,
		images.created_at,
		users.username
	FROM images
	JOIN users ON users.id = images.user_id
	WHERE ` + strings.Join(conditions, " AND ") + `
	ORDER BY images.created_at DESC, images.id DESC
	LIMIT $` + limitArg + ` OFFSET $` + offsetArg

	rows, err := d.DB.Pool.Query(c.Request.Context(), query, args...)
	if err != nil {
		log.Printf("[ERROR] Image search failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search images"})
		return
	}
	defer rows.Close()

	results := []ImageResult{}
	for rows.Next() {
		var img ImageResult
		if err := rows.Scan(&img.ID, &img.UserID, &img.Title, &img.ImageURL, &img.CreatedAt, &img.Username); err != nil {
			log.Printf("[ERROR] Failed to scan image search row: %v", err)
			continue
		}
		results = append(results, img)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      results,
		"page_size": imagePageSize,
	})
}
