package auth

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func (d *Database) Register(c *gin.Context) {
	var input User
	var user User

	// 1. Bind and validate JSON input properly
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// 2. Hash password using bcrypt
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}
	hashedPassword := string(hashedBytes)

	// 3. Insert user into the Supabase PostgreSQL database
	insertQuery := "INSERT INTO users (email, username, password) VALUES ($1, $2, $3)"
	_, err = d.DB.Pool.Exec(c.Request.Context(), insertQuery, input.Email, input.Username, hashedPassword)
	if err != nil {
		// This will catch unique constraint violations (duplicate email or username)
		c.JSON(http.StatusConflict, gin.H{"error": "Email or username already exists"})
		return
	}

	// 4. Fetch the newly created user to get their assigned ID
	selectQuery := "SELECT id, email, username FROM users WHERE email = $1"
	err = d.DB.Pool.QueryRow(c.Request.Context(), selectQuery, input.Email).Scan(&user.ID, &user.Email, &user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find user after creation"})
		return
	}

	// 5. Create JWT Token for auto-login
	token, err := CreateToken(user.ID, user.Email, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create token"})
		return
	}

	// 6. Set Cookie properties
	c.SetSameSite(http.SameSiteStrictMode)

	maxAge := 2 * 60 * 60 // 2 hours
	isSecure := os.Getenv("GIN_MODE") == "release"

	c.SetCookie(
		"image-web-auth_token",
		token,
		maxAge,
		"/",
		"localhost",
		isSecure,
		true, // HttpOnly
	)

	// 7. Return success response with username and HTTP Status Created
	c.JSON(http.StatusCreated, gin.H{
		"message": "Success",
		"data":    user.Username,
	})
}
