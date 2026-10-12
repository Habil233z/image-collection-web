package login

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"os"
	"strconv"
	"time"

	"image-web-backend/resources/database"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Database struct {
	DB *database.Postgres
}

type loginInput struct {
	Id              int
	EmailOrUsername string
	Password        string
}

type user struct {
	id       int
	email    string
	username string
	password string
}

type customClaims struct {
	Id       string `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func CreateToken(id string, email string, username string) (string, error) {
	secretKey := []byte(os.Getenv("SECRET_KEY"))
	claims := customClaims{
		Id:       id,
		Email:    email,
		Username: username,
	}
	claims.RegisteredClaims = jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		NotBefore: jwt.NewNumericDate(time.Now()),
		Issuer:    "Image-Web",
		Subject:   "authentication",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secretKey)
}

func (h *Database) Login(c *gin.Context) {
	var input loginInput
	var user user

	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	err := h.DB.Pool.QueryRow(context.Background(), "SELECT * FROM users WHERE username = $1 OR email = $1", input.EmailOrUsername).Scan(&user.id, &user.email, &user.username, &user.password)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Rows not found",
				"message": "User didn't exitst",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Wrong Password"})
		return
	}

	token, err := CreateToken(strconv.Itoa(user.id), user.email, user.username)
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
		"data":    user.username,
	})
}
