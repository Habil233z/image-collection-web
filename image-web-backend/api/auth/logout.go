package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (d *Database) Logout(c *gin.Context) {
	c.SetCookie("image-web-auth_token", "", -1, "/", "localhost", false, true)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logged out successfully",
	})
}
