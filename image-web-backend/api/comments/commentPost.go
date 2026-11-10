package comments

import (
	"net/http"
	"time" // 1. Import time package

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (d *Database) PostComment(c *gin.Context) {
	imageID := c.Param("id")

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

	var input struct {
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	query := `INSERT INTO comments (image_id, user_id, comment) VALUES ($1, $2, $3) RETURNING id, created_at`
	var commentID int
	var createdAt time.Time // 2. Changed from string to time.Time

	err := d.DB.Pool.QueryRow(c.Request.Context(), query, imageID, userID, input.Comment).Scan(&commentID, &createdAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to post comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Comment posted successfully",
		"comment_id": commentID,
		"created_at": createdAt, // Gin/json encoder will automatically format this as an ISO string
	})
}
