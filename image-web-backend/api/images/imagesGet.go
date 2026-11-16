package images

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (d *Database) Images(c *gin.Context) {
	// Adjust column names if your table uses image_name instead of title
	query := `SELECT id, user_id, title, image_url, created_at FROM images ORDER BY created_at DESC`
	rows, err := d.DB.Pool.Query(c.Request.Context(), query)
	if err != nil {
		log.Printf("[ERROR] Database query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch images"})
		return
	}
	defer rows.Close()

	images := []Image{}

	for rows.Next() {
		var img Image
		if err := rows.Scan(&img.ID, &img.UserID, &img.Title, &img.ImageURL, &img.CreatedAt); err != nil {
			log.Printf("[ERROR] Failed to scan image row: %v", err)
			continue
		}
		images = append(images, img)
	}

	log.Printf("[DEBUG] Fetched %d images from database", len(images))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    images,
	})
}
