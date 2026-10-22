package images

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
)

func (d *Database) EditImage(c *gin.Context) {
	paramsId := c.Param("id")
	imageId, err := strconv.Atoi(paramsId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
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
	userId := int(idFloat)
	username := claims["username"].(string)

	var currentImagePath string
	var creatorId int

	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT user_id, image_path FROM user_images WHERE id = $1", imageId).Scan(&creatorId, &currentImagePath)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	if creatorId != userId {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: You do not have permission to edit this image"})
		return
	}

	imageName := c.PostForm("image_name")
	file, fileErr := c.FormFile("imageFile")

	newImagePath := currentImagePath

	if fileErr == nil {
		uploadDir := "./uploads/" + username + "/userImage"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		ext := filepath.Ext(file.Filename)
		uniqueFilename := fmt.Sprintf("%s-%d%s", username, time.Now().UnixNano(), ext)
		newImagePath = filepath.Join(uploadDir, uniqueFilename)

		if err := c.SaveUploadedFile(file, newImagePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save the new image file"})
			return
		}
		_ = os.Remove(currentImagePath)
	}

	_, err = d.DB.Pool.Exec(c.Request.Context(), `UPDATE user_images SET image_name = $1, image_path = $2 WHERE id = $3`, imageName, newImagePath, imageId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"message":  "Image updated successfully",
		"new_path": newImagePath,
	})
}
