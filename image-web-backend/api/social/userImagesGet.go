package social

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (d *Database) GetUserImages(c *gin.Context) {
	userId, err := strconv.Atoi(c.Param("id"))
	if err != nil || userId < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	offset := (page - 1) * imagePageSize

	rows, err := d.DB.Pool.Query(c.Request.Context(), `
		SELECT id, user_id, title, image_url, created_at
		FROM images
		WHERE user_id = $1
		ORDER BY created_at DESC, id DESC
		LIMIT $2 OFFSET $3`, userId, imagePageSize, offset)
	if err != nil {
		log.Printf("[ERROR] GetUserImages query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch images"})
		return
	}
	defer rows.Close()

	images := []UserImage{}
	for rows.Next() {
		var img UserImage
		if err := rows.Scan(&img.ID, &img.UserID, &img.Title, &img.ImageURL, &img.CreatedAt); err != nil {
			log.Printf("[ERROR] GetUserImages scan failed: %v", err)
			continue
		}
		images = append(images, img)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      images,
		"page_size": imagePageSize,
	})
}
