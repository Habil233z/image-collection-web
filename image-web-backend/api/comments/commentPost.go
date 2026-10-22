package comments

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
)

func (d *Database) CommentImage(c *gin.Context) {
	var comment Comments

	paramsId := c.Param("id")
	imageId, err := strconv.Atoi(paramsId)

	if err := c.BindJSON(&comment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
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
	Id := int(idFloat)
	var id int

	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT id FROM users WHERE id = $1", &Id).Scan(&id)
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

	_, err = d.DB.Pool.Exec(c.Request.Context(), "INSERT INTO image_comments (image_id, user_id, comment, created_at) VALUES ($1, $2, $3, NOW())", imageId, id, comment.Comment)
	if err != nil {
		println("[Upload Error] DB Insert failed:", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to comment on image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Has successfully comment on image",
	})
}
