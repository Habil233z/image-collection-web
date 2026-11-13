package auth

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func (d *Database) Logout(c *gin.Context) {
	isRelease := os.Getenv("GIN_MODE") == "release"

	sameSite := http.SameSiteLaxMode
	if isRelease {
		sameSite = http.SameSiteNoneMode
	}

	clearCookie := &http.Cookie{
		Name:        "image-web-auth_token",
		Value:       "",
		Path:        "/",
		MaxAge:      -1, // Expires immediately
		Secure:      isRelease,
		HttpOnly:    true,
		SameSite:    sameSite,
		Partitioned: true,
	}

	http.SetCookie(c.Writer, clearCookie)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logged out successfully",
	})
}
