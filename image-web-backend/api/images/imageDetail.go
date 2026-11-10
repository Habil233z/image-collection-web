package images

import (
	"net/http"

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
	users.username
	
	FROM images
	JOIN users on images.user_id = users.id
	WHERE images.id = $1`
	var img Image
	err := d.DB.Pool.QueryRow(c.Request.Context(), query, imageID).Scan(&img.ID, &img.UserID, &img.Title, &img.ImageURL, &img.CreatedAt, &img.Username)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    img})
}
