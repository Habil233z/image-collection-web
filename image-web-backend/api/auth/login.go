package auth

import (
	"errors"
	"net/http"

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

	err := d.DB.Pool.QueryRow(
		c.Request.Context(),
		"SELECT id, email, username, password FROM users WHERE username = $1 OR email = $1",
		input.EmailOrUsername,
	).Scan(&user.ID, &user.Email, &user.Username, &user.Password)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Rows not found",
				"message": "User doesn't exist",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database query failed"})
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

	proto := c.GetHeader("X-Forwarded-Proto")
	origin := c.GetHeader("Origin")

	isLocalhost := proto == "http" || origin == "http://localhost:3000" || origin == "http://127.0.0.1:3000"

	var secureFlag bool
	var sameSiteMode http.SameSite

	if isLocalhost {
		// Local HTTP development via proxy requires Secure=false and SameSite=Lax
		secureFlag = false
		sameSiteMode = http.SameSiteLaxMode
	} else {
		// Production HTTPS requires Secure=true and SameSite=None
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
		Partitioned: !isLocalhost,
	}

	http.SetCookie(c.Writer, authCookie)

	c.JSON(http.StatusOK, gin.H{
		"message": "Login Success",
		"data":    user.Username,
	})
}
