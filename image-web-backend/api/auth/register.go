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
	// Detect if request is coming through local development / proxy
	origin := c.GetHeader("Origin")
	host := c.GetHeader("X-Forwarded-Host")
	isLocal := origin == "http://localhost:3000" || origin == "http://127.0.0.1:3000" || host == "localhost:3000"

	var secureFlag bool
	var sameSiteMode http.SameSite

	if isLocal {
		// Local development via proxy: MUST be Secure=false and SameSite=Lax
		secureFlag = false
		sameSiteMode = http.SameSiteLaxMode
	} else {
		// Production Vercel: Secure=true and SameSite=None
		secureFlag = true
		sameSiteMode = http.SameSiteNoneMode
	}

	authCookie := &http.Cookie{
		Name:        "image-web-auth_token",
		Value:       token,
		Path:        "/",
		MaxAge:      2 * 60 * 60,
		Secure:      secureFlag,
		HttpOnly:    true,
		SameSite:    sameSiteMode,
		Partitioned: !isLocal, // False locally, True in production
	}

	println("[DEBUG] About to set cookie...")
	http.SetCookie(c.Writer, authCookie)
	println("[DEBUG] Cookie set successfully. Sending JSON...")

	c.JSON(http.StatusOK, gin.H{
		"message": "Login Success",
		"data":    user.Username,
	})
	println("[DEBUG] JSON sent successfully!")
}
