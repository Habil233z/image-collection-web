package likes

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// LikedImage is an image the current user has liked.
type LikedImage struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Title     string    `json:"title"`
	ImageURL  string    `json:"image_url"`
	CreatedAt time.Time `json:"created_at"`
	Username  string    `json:"username"`
}

// GetLikedImages returns every image the logged-in user has liked
// (image likes only - comment/reply likes are excluded), newest like first.
// Registered behind AuthMiddleware.
func (d *Database) GetLikedImages(c *gin.Context) {
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

	query := `SELECT
		images.id,
		images.user_id,
		images.title,
		images.image_url,
		images.created_at,
		users.username
	FROM likes
	JOIN images ON images.id = likes.image_id
	JOIN users ON users.id = images.user_id
	WHERE likes.user_id = $1
		AND likes.image_id IS NOT NULL
		AND likes.comment_id IS NULL
		AND likes.reply_id IS NULL
	ORDER BY likes.id DESC`

	rows, err := d.DB.Pool.Query(c.Request.Context(), query, userID)
	if err != nil {
		log.Printf("[ERROR] Liked images query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch liked images"})
		return
	}
	defer rows.Close()

	liked := []LikedImage{}
	for rows.Next() {
		var img LikedImage
		if err := rows.Scan(&img.ID, &img.UserID, &img.Title, &img.ImageURL, &img.CreatedAt, &img.Username); err != nil {
			log.Printf("[ERROR] Failed to scan liked image row: %v", err)
			continue
		}
		liked = append(liked, img)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    liked,
	})
}
