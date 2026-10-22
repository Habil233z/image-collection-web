package comments

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (d *Database) Comments(c *gin.Context) {
	paramsId := c.Param("id")
	id, err := strconv.Atoi(paramsId)

	rows, err := d.DB.Pool.Query(c.Request.Context(), `
	SELECT
	image_comments.id,
	image_comments.image_id,
	image_comments.user_id,
	image_comments.comment,
	image_comments.created_at,
	users.username
	
	FROM image_comments
	JOIN users ON image_comments.user_id = users.id
	WHERE image_comments.image_id = $1
	ORDER BY created_at ASC
	`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database: " + err.Error()})
		return
	}
	defer rows.Close()

	var comments []Comments
	for rows.Next() {
		var comment Comments
		if err := rows.Scan(&comment.Id, &comment.Image_id, &comment.User_id, &comment.Comment, &comment.Created_at, &comment.Username); err != nil {
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
