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
		replies.id, 
		replies.comment_id, 
		replies.user_id, 
		users.username, 
		replies.reply, 
		replies.created_at

		FROM replies
		JOIN users ON replies.user_id = users.id
		WHERE replies.comment_id = $1
		ORDER BY replies.created_at ASC
	`
	rows, err := d.DB.Pool.Query(c.Request.Context(), query, commentId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch replies: " + err.Error()})
		return
	}
	defer rows.Close()

	replies := []ReplyResponse{}
	for rows.Next() {
		var reply ReplyResponse
		if err := rows.Scan(&reply.Id, &reply.CommentId, &reply.UserId, &reply.Username, &reply.Reply, &reply.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse replies: " + err.Error()})
			return
		}
		replies = append(replies, reply)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Replies fetched successfully",
		"data":    replies,
	})
}
