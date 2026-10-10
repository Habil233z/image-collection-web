package register

import (
	"context"
	"os"
	"strconv"
	"time"

	"net/http"

	"image-web-backend/resources/database"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

type Database struct {
	DB *database.Postgres
}

type registerInput struct {
	id       int
	email    string
	username string
	password string
}

type user struct {
	id       int
	email    string
	username string
}

type customClaims struct {
	id       string
	email    string
	username string
	jwt.RegisteredClaims
}

func CreateToken(id string, email string, username string) (string, error) {
	secretKey := []byte(os.Getenv("SECRET_KEY"))
	claims := customClaims{
		id:        id,
		email:     email,
		username:  username,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		NotBefore: jwt.NewNumericDate(time.Now()),
		Issuer:    "Image-Web",
		Subject:   "authentication",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secretKey)
}

func (h *Database) Register(c *gin.Context) {
	err := godotenv.Load()
	var input registerInput
	var user user

	if err := c.BindJSON(&input); err != nil {
		return
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(input.password), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}
	hashedPassword := string(hashedBytes)

	_, err = h.DB.Pool.Query(context.Background(), "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", input.email, input.username, hashedPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
	}

	err = h.DB.Pool.QueryRow(context.Background(), "SELECT id, email, username FROM users WHERE email = $1", input.email).Scan(&user.id, &user.email, &user.username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find user after create user"})
		return
	}

	token, err := CreateToken(strconv.Itoa(user.id), user.email, user.username)
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
		"data":    user.username,
	})
}
