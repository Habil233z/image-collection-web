package register

import (
	"context"
	"os"
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

type RegisterInput struct {
	Id       int    `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type CustomClaims struct {
	UserID string `json:"user_username"`
	jwt.RegisteredClaims
}

func CreateToken(userID string) (string, error) {
	secretKey := []byte(os.Getenv("SECRET_KEY"))
	claims := CustomClaims{
		UserID:    userID,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		NotBefore: jwt.NewNumericDate(time.Now()),
		Issuer:    "Image-Web",
		Subject:   userID,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secretKey)
}

func (h *Database) Register(c *gin.Context) {
	err := godotenv.Load()
	var input RegisterInput

	if err := c.BindJSON(&input); err != nil {
		return
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}
	hashedPassword := string(hashedBytes)

	_, err = h.DB.Pool.Query(context.Background(), "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", input.Email, input.Username, hashedPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
	}

	token, err := CreateToken(input.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Success",
		"token":   token,
		"data":    input.Username,
	})
}
