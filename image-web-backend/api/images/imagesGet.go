package images

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (d *Database) Images(c *gin.Context) {
	pageParams := c.DefaultQuery("page", "1")
	page, err := strconv.Atoi(pageParams)
	if page < 1 {
		page = 1
	}

	limit := 20
	offset := (page - 1) * limit

	rows, err := d.DB.Pool.Query(c.Request.Context(), "SELECT id, image_name, created_at, image_path FROM user_images ORDER BY created_at ASC LIMIT $1 OFFSET $2", limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database: " + err.Error()})
		return
	}
	defer rows.Close()

	var images []Images
	for rows.Next() {
		var img Images
		if err := rows.Scan(&img.Id, &img.Image_name, &img.Created_at, &img.Image_path); err != nil {
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
