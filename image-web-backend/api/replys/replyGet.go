package replys

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (d *Database) GetReplies(c *gin.Context) {
	commentIdStr := c.Param("commentId")
	commentId, err := strconv.Atoi(commentIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	query := `
		SELECT 
		comment_replies.id, 
		comment_replies.comment_id, 
		comment_replies.user_id, 
		users.username, 
		comment_replies.reply, 
		comment_replies.created_at

		FROM comment_replies
		JOIN users ON comment_replies.user_id = users.id
		WHERE comment_replies.comment_id = $1
		ORDER BY comment_replies.created_at ASC
	`
	rows, err := d.DB.Pool.Query(c.Request.Context(), query, commentId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch replies area 1" + err.Error()})
		return
	}
	defer rows.Close()

	replies := []ReplyResponse{}
	for rows.Next() {
		var reply ReplyResponse
		if err := rows.Scan(&reply.Id, &reply.CommentId, &reply.UserId, &reply.Username, &reply.Reply, &reply.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse replies area 2"})
			return
		}
		replies = append(replies, reply)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Replies fetched successfully",
		"data":    replies,
	})
}
