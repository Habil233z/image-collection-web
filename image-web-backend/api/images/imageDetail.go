package images

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

func (d *Database) ImageDetail(c *gin.Context) {
	var images Images
	paramsId := c.Param("id")
	println("DEBUG - Received paramsId:", paramsId)
	id, err := strconv.Atoi(paramsId)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT id, image_name, user_id, created_at, image_path FROM user_images WHERE id = $1", id).Scan(&images.Id, &images.Image_name, &images.User_id, &images.Created_at, &images.Image_path)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Rows not found",
				"message": "User doesn't exist",
			})
			return
		}

		println("DB Query failed:", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    images,
	})
}
