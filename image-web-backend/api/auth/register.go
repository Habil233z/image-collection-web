package auth

import (
	"os"

	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func (d *Database) Register(c *gin.Context) {
	err := godotenv.Load()
	var input RegisterInput
	var user User

	if err := c.BindJSON(&input); err != nil {
		return
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}
	hashedPassword := string(hashedBytes)

	_, err = d.DB.Pool.Query(c.Request.Context(), "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", input.Email, input.Username, hashedPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
	}

	err = d.DB.Pool.QueryRow(c.Request.Context(), "SELECT id, email, username FROM users WHERE email = $1", input.Email).Scan(&user.Id, &user.Email, &user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find user after create user"})
		return
	}

	token, err := CreateToken(user.Id, user.Email, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create token"})
		return
	}

	c.SetSameSite(http.SameSiteStrictMode)

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

	c.JSON(http.StatusCreated, gin.H{
		"message": "Success",
		"data":    user.Username,
	})
}
