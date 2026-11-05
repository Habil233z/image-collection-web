package replys

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
)

func (d *Database) DeleteReply(c *gin.Context) {
	replyParamsId := c.Param("replyId")
	replyId, err := strconv.Atoi(replyParamsId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reply ID format"})
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
	userId := int(idFloat)
	var userid int

	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT id FROM users WHERE id = $1", &userId).Scan(&userid)
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

	var replierId int
	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT user_id FROM comment_replies WHERE id = $1", &replyId).Scan(&replierId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Rows not found",
				"message": "Reply doesn't exist",
			})
			return
		}

		println("DB Query failed:", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	if replierId != userid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "You didn't have the authorization to delete this reply"})
		return
	}

	_, err = d.DB.Pool.Exec(c.Request.Context(), "DELETE FROM comment_replies WHERE id = $1", &replyId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete this reply from database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Reply deleted successfully",
	})
}
