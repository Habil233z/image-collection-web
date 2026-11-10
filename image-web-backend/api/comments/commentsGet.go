package comments

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (d *Database) GetComments(c *gin.Context) {
	pageParams := c.DefaultQuery("page", "1")
	page, err := strconv.Atoi(pageParams)
	if page < 1 {
		page = 1
	}

	limit := 8
	offset := (page - 1) * limit

	paramsId := c.Param("id")
	id, err := strconv.Atoi(paramsId)

	rows, err := d.DB.Pool.Query(c.Request.Context(), `
	SELECT
	comments.id,
	comments.image_id,
	comments.user_id,
	comments.comment,
	comments.created_at,
	users.username
	s
	FROM comments
	JOIN users ON comments.user_id = users.id
	WHERE comments.image_id = $1
	ORDER BY created_at ASC
	LIMIT $2 OFFSET $3
	`, id, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database: " + err.Error()})
		return
	}
	defer rows.Close()

	var comments []Comments
	for rows.Next() {
		var comment Comments
		if err := rows.Scan(&comment.ID, &comment.ImageID, &comment.UserID, &comment.Comment, &comment.CreatedAt, &comment.Username); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse image comments" + err.Error()})
			return
		}
		comments = append(comments, comment)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    comments,
	})
}
