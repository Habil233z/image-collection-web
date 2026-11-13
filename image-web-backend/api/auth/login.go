package auth

import (
	"errors"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

func (d *Database) Login(c *gin.Context) {
	var input LoginInput
	var user User

	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	err := d.DB.Pool.QueryRow(c.Request.Context(), "SELECT id, email, username, password FROM users WHERE username = $1 OR email = $1", input.EmailOrUsername).Scan(&user.ID, &user.Email, &user.Username, &user.Password)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Rows not found",
				"message": "User doesn't exist",
			})
			return
		}

		// PRINT THE EXACT ERROR IN YOUR TERMINAL
		println("[Login Error] DB Query failed:", err.Error())

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error: " + err.Error()})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Wrong Password"})
		return
	}

	token, err := CreateToken(user.ID, user.Email, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create token"})
		return
	}

	// Determine if we are in production (release mode)
	isRelease := os.Getenv("GIN_MODE") == "release"

	// Set SameSite=None and Secure=true for cross-site production, Lax for local dev
	sameSite := http.SameSiteLaxMode
	if isRelease {
		sameSite = http.SameSiteNoneMode
	}

	maxAge := 2 * 60 * 60 // 2 hours

	// Construct native http.Cookie with Partitioned enabled (CHIPS)
	authCookie := &http.Cookie{
		Name:        "image-web-auth_token",
		Value:       token,
		Path:        "/",
		MaxAge:      maxAge,
		Secure:      isRelease, // Must be true in production when using SameSite=None
		HttpOnly:    true,      // Prevents JavaScript access
		SameSite:    sameSite,  // NoneMode in production, LaxMode locally
		Partitioned: true,      // Isolates the cookie per top-level site context
	}

	http.SetCookie(c.Writer, authCookie)

	c.JSON(http.StatusOK, gin.H{
		"message": "Login Success",
		"data":    user.Username,
	})
}
