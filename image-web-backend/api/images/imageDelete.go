package images

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (d *Database) DeleteImage(c *gin.Context) {
	imageID := c.Param("id")
	if imageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image ID is required"})
		return
	}

	token, exists := c.Get("auth_token")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: User data not found"})
		return
	}

	claims, ok := token.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user claims"})
		return
	}

	idFloat, ok := claims["id"].(float64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID claim type"})
		return
	}
	userID := int(idFloat)

	var imageURL string
	var ownerID int
	querySelect := `SELECT user_id, image_url FROM images WHERE id = $1`
	err := d.DB.Pool.QueryRow(c.Request.Context(), querySelect, imageID).Scan(&ownerID, &imageURL)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	if ownerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	parts := strings.Split(imageURL, "/")
	fileName := parts[len(parts)-1]

	_, _ = d.SupabaseClient.RemoveFile(d.BucketName, []string{fileName})

	queryDelete := `DELETE FROM images WHERE id = $1`
	_, err = d.DB.Pool.Exec(c.Request.Context(), queryDelete, imageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image from database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Image successfully deleted from Supabase and database",
	})
}
