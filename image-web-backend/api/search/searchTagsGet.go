package search

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func (d *Database) SearchTags(c *gin.Context) {
	q := normalizeTag(strings.TrimSpace(c.Query("q")))

	rows, err := d.DB.Pool.Query(c.Request.Context(), `
		SELECT t.tag, COUNT(*) AS uses
		FROM images
		CROSS JOIN LATERAL unnest(images.tags) AS t(tag)
		WHERE t.tag LIKE $1
		GROUP BY t.tag
		ORDER BY uses DESC, t.tag ASC
		LIMIT $2`, escapeLike(q)+"%", tagLimit)
	if err != nil {
		log.Printf("[ERROR] Tag search failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search tags"})
		return
	}
	defer rows.Close()

	results := []TagResult{}
	for rows.Next() {
		var t TagResult
		if err := rows.Scan(&t.Tag, &t.Count); err != nil {
			log.Printf("[ERROR] Failed to scan tag row: %v", err)
			continue
		}
		results = append(results, t)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    results,
	})
}
