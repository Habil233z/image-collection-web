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

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// 2. Set cookie for production environments
	isProduction := os.Getenv("GIN_MODE") == "release" || os.Getenv("VERCEL") != ""
	authCookie := &http.Cookie{
		Name:        "image-web-auth_token",
		Value:       token,
		Path:        "/",
		MaxAge:      2 * 60 * 60,
		Secure:      isProduction,
		HttpOnly:    true,
		SameSite:    http.SameSiteLaxMode,
		Partitioned: isProduction,
	}
	http.SetCookie(c.Writer, authCookie)

	// 3. CRITICAL: Return the token in the JSON body so your frontend JavaScript can read it!
	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
	})
}
