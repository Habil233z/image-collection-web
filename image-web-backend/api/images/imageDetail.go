package images

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

func (d *Database) ImageDetail(c *gin.Context) {
	var images ImageDetail
	paramsId := c.Param("id")
	id, err := strconv.Atoi(paramsId)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	err = d.DB.Pool.QueryRow(c.Request.Context(), `
	SELECT 

	user_images.id, 
	user_images.image_name, 
	user_images.user_id, 
	user_images.created_at, 
	user_images.image_path, 
	users.username

	FROM user_images
	JOIN users ON user_images.user_id = users.id
	WHERE user_images.id = $1`, id).Scan(&images.Id, &images.Image_name, &images.User_id, &images.Created_at, &images.Image_path, &images.Username)
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
