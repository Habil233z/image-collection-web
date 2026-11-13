package auth

import (
	"net/http"

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
	// Determine if we are in production (release mode)

	// Set SameSite=None and Secure=true for cross-site production, Lax for local dev

	// Construct native http.Cookie with Partitioned enabled (CHIPS)
	authCookie := &http.Cookie{
		Name:        "image-web-auth_token",
		Value:       token,
		Path:        "/",
		MaxAge:      2 * 60 * 60,
		Secure:      true,                  // Required when SameSite=None
		HttpOnly:    true,                  // Prevents JavaScript access
		SameSite:    http.SameSiteNoneMode, // Required for cross-site requests
		Partitioned: true,                  // CHIPS attribute for modern browser compatibility
	}

	http.SetCookie(c.Writer, authCookie)

	// 7. Return success response with username and HTTP Status Created
	c.JSON(http.StatusCreated, gin.H{
		"message": "Success",
		"data":    user.Username,
	})
}
