package images

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (d *Database) Images(c *gin.Context) {
	rows, err := d.DB.Pool.Query(c.Request.Context(), "SELECT id, image_name, user_id, created_at, image_path FROM user_images ORDER BY created_at ASC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database: " + err.Error()})
		return
	}
	defer rows.Close()

	var images []Images
	for rows.Next() {
		var img Images
		if err := rows.Scan(&img.Id, &img.Image_name, &img.User_id, &img.Created_at, &img.Image_path); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse image records" + err.Error()})
			return
		}
		images = append(images, img)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    images,
	})
}
