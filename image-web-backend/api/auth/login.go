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

	err := d.DB.Pool.QueryRow(c.Request.Context(), "SELECT id, email, username, password FROM users WHERE username = $1 OR email = $1", input.EmailOrUsername).Scan(&user.Id, &user.Email, &user.Username, &user.Password)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Rows not found",
				"message": "User didn't exitst",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Wrong Password"})
		return
	}

	token, err := CreateToken(user.Id, user.Email, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create token"})
		return
	}

	c.SetSameSite(http.SameSiteLaxMode)

	maxAge := 2 * 60 * 60
	isSecure := os.Getenv("GIN_MODE") == "release"

	c.SetCookie(
		"image-web-auth_token",
		token,
		maxAge,
		"/",
		"localhost",
		isSecure,
		true,
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Login Success",
		"data":    user.Username,
	})
}
