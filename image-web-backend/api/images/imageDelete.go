package images

import (
	"errors"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
)

func (d *Database) DeleteImage(c *gin.Context) {
	paramsId := c.Param("id")
	imageID, err := strconv.Atoi(paramsId)
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
	userID := int(idFloat)

	var ownerID int
	var imagePath string
	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT user_id, image_path FROM user_images WHERE id = $1", imageID).Scan(&ownerID, &imagePath)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	if ownerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: You do not own this image"})
		return
	}

	_, err = d.DB.Pool.Exec(c.Request.Context(), "DELETE FROM user_images WHERE id = $1", imageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image record from database"})
		return
	}

	if imagePath != "" {
		_ = os.Remove(imagePath)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Image deleted successfully",
	})
}
