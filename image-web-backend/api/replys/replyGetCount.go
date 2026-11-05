package replys

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (d *Database) GetReplyCount(c *gin.Context) {
	commentIdStr := c.Param("commentId")
	commentId, err := strconv.Atoi(commentIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	var count int
	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT COUNT(*) FROM comment_replies WHERE comment_id = $1", commentId).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reply count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Reply count fetched successfully",
		"replyCount": count,
	})
}
