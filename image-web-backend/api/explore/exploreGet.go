package explore

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (d *Database) GetExplore(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	userId := 0
	if token, exists := c.Get("auth_token"); exists {
		if claims, ok := token.(jwt.MapClaims); ok {
			if idFloat, ok := claims["id"].(float64); ok {
				userId = int(idFloat)
			}
		}
	}

	hasLikes := false
	if userId > 0 {
		err := d.DB.Pool.QueryRow(c.Request.Context(), `
			SELECT EXISTS (
				SELECT 1 FROM likes
				WHERE user_id = $1 AND image_id IS NOT NULL AND comment_id IS NULL AND reply_id IS NULL
			)`, userId).Scan(&hasLikes)
		if err != nil {
			log.Printf("[ERROR] Explore likes check failed: %v", err)
		}
	}

	query := `
	WITH liked AS (
		SELECT image_id FROM likes
		WHERE user_id = $1 AND image_id IS NOT NULL AND comment_id IS NULL AND reply_id IS NULL
	),
	liked_tags AS (
		SELECT t.tag, COUNT(*) AS weight
		FROM images
		JOIN liked ON liked.image_id = images.id
		CROSS JOIN LATERAL unnest(images.tags) AS t(tag)
		GROUP BY t.tag
	),
	liked_authors AS (
		SELECT images.user_id, COUNT(*) AS weight
		FROM images
		JOIN liked ON liked.image_id = images.id
		GROUP BY images.user_id
	),
	candidates AS (
		SELECT
			images.id,
			images.user_id,
			images.title,
			images.image_url,
			images.created_at,
			users.username,
			COALESCE((
				SELECT SUM(liked_tags.weight)::bigint
				FROM liked_tags
				WHERE liked_tags.tag = ANY(images.tags)
			), 0) AS tag_score,
			COALESCE((
				SELECT liked_authors.weight
				FROM liked_authors
				WHERE liked_authors.user_id = images.user_id
			), 0) AS author_score,
			COALESCE((
				SELECT liked_tags.tag
				FROM liked_tags
				WHERE liked_tags.tag = ANY(images.tags)
				ORDER BY liked_tags.weight DESC, liked_tags.tag ASC
				LIMIT 1
			), '') AS top_tag,
			(
				SELECT COUNT(*) FROM likes
				WHERE likes.image_id = images.id AND likes.comment_id IS NULL AND likes.reply_id IS NULL
			) AS like_count
		FROM images
		JOIN users ON users.id = images.user_id
		WHERE images.user_id <> $1
			AND images.id NOT IN (SELECT image_id FROM liked)
	)
	SELECT
		id, user_id, title, image_url, created_at, username,
		tag_score * 2 + author_score * 3 AS score,
		top_tag,
		author_score > 0
	FROM candidates
	ORDER BY score DESC, like_count DESC, created_at DESC, id DESC
	LIMIT $2 OFFSET $3`

	rows, err := d.DB.Pool.Query(c.Request.Context(), query, userId, pageSize, offset)
	if err != nil {
		log.Printf("[ERROR] Explore query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch explore images"})
		return
	}
	defer rows.Close()

	images := []ExploreImage{}
	for rows.Next() {
		var img ExploreImage
		if err := rows.Scan(&img.ID, &img.UserID, &img.Title, &img.ImageURL, &img.CreatedAt, &img.Username, &img.Score, &img.ReasonTag, &img.LikedUploader); err != nil {
			log.Printf("[ERROR] Failed to scan explore row: %v", err)
			continue
		}
		images = append(images, img)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      images,
		"page_size": pageSize,
		"has_likes": hasLikes,
	})
}
