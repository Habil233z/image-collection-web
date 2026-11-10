package images

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	storage_go "github.com/supabase-community/storage-go"
)

func (d *Database) UploadImage(c *gin.Context) {
	title := c.PostForm("imageName")
	fileHeader, err := c.FormFile("imageFile")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing image file"})
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

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open uploaded file"})
		return
	}
	defer file.Close()

	ext := filepath.Ext(fileHeader.Filename)
	fileName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), ext)
	contentType := fileHeader.Header.Get("Content-Type")

	_, err = d.SupabaseClient.UploadFile(d.BucketName, fileName, file, storage_go.FileOptions{
		ContentType: &contentType,
		Upsert:      boolPtr(false),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Supabase upload failed: %v", err)})
		return
	}

	supabaseURL := os.Getenv("SUPABASE_URL")
	publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", supabaseURL, d.BucketName, fileName)

	query := `INSERT INTO images (user_id, title, image_url, created_at) VALUES ($1, $2, $3, $4) RETURNING id`
	var imageID int
	createdAt := time.Now()

	err = d.DB.Pool.QueryRow(c.Request.Context(), query, userID, title, publicURL, createdAt).Scan(&imageID)
	if err != nil {
		_, _ = d.SupabaseClient.RemoveFile(d.BucketName, []string{fileName})
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image record to database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Image uploaded successfully",
		"image_id":  imageID,
		"image_url": publicURL,
	})
}

func boolPtr(b bool) *bool {
	return &b
}
