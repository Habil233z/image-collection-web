package images

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	storage_go "github.com/supabase-community/storage-go"
)

func (d *Database) EditImage(c *gin.Context) {
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

	var existingURL string
	var ownerID int
	err := d.DB.Pool.QueryRow(c.Request.Context(), `SELECT user_id, image_url FROM images WHERE id = $1`, imageID).Scan(&ownerID, &existingURL)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	if ownerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	title := c.PostForm("title")
	newURL := existingURL

	// FIXED: Look for "imageFile" to match frontend FormData
	fileHeader, err := c.FormFile("imageFile")
	if err == nil {
		file, err := fileHeader.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open new image file"})
			return
		}
		defer file.Close()

		ext := filepath.Ext(fileHeader.Filename)
		newFileName := fmt.Sprintf("%d_%s", timeNano(), ext)
		contentType := fileHeader.Header.Get("Content-Type")

		_, err = d.SupabaseClient.UploadFile(d.BucketName, newFileName, file, storage_go.FileOptions{
			ContentType: &contentType,
			Upsert:      boolPtr(false),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload new image to Supabase"})
			return
		}

		supabaseURL := os.Getenv("SUPABASE_URL")
		newURL = fmt.Sprintf("%s/storage/v1/object/public/%s/%s", supabaseURL, d.BucketName, newFileName)

		oldParts := strings.Split(existingURL, "/")
		oldFileName := oldParts[len(oldParts)-1]
		_, _ = d.SupabaseClient.RemoveFile(d.BucketName, []string{oldFileName})
	}

	queryUpdate := `UPDATE images SET title = COALESCE(NULLIF($1, ''), title), image_url = $2, updated_at = NOW() WHERE id = $3`
	_, err = d.DB.Pool.Exec(c.Request.Context(), queryUpdate, title, newURL, imageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update image record in database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Image updated successfully",
		"image_url": newURL,
	})
}

func timeNano() int64 {
	return time.Now().UnixNano()
}
