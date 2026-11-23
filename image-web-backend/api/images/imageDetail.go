package images

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func (d *Database) ImageDetail(c *gin.Context) {
	imageID := c.Param("id")
	if imageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image ID is required"})
		return
	}

	query := `SELECT
	images.id, 
	images.user_id, 
	images.title, 
	images.image_url, 
	images.created_at,
	users.username,
	COALESCE(users.avatar_url, ''),
	COALESCE(array_to_string(images.tags, ','), '')
	
	FROM images
	JOIN users on images.user_id = users.id
	WHERE images.id = $1`
	var img Image
	var tags string
	err := d.DB.Pool.QueryRow(c.Request.Context(), query, imageID).Scan(&img.ID, &img.UserID, &img.Title, &img.ImageURL, &img.CreatedAt, &img.Username, &img.AvatarURL, &tags)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	img.Tags = []string{}
	if tags != "" {
		img.Tags = strings.Split(tags, ",")
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    img})
}
