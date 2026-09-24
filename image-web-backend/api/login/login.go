package login

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"image-web-backend/resources/database"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
)

type Database struct {
	DB *database.Postgres
}

type LoginInput struct {
	Id              int    `json:"id"`
	EmailOrUsername string `json:"emailOrUsername"`
	Password        string `json:"password"`
}

type User struct {
	Id       int    `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"-"`
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

func (h *Database) Login(c *gin.Context) {
	err := godotenv.Load()
	var input LoginInput
	var user User

	if err := c.BindJSON(&input); err != nil {
		return
	}

	err = h.DB.Pool.QueryRow(context.Background(), "SELECT * FROM users WHERE username = $1 OR email = $1", input.EmailOrUsername).Scan(&user.Id, &user.Username, &user.Email, &user.Password)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Rows not found",
				"message": "User didn't exitst",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		log.Fatalf("error finding user: %v", err)
		return
	}

	if input.Password != user.Password {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Password wrong",
		})
		return
	}

	token, err := CreateToken(user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login Success",
		"token":   token,
		"data":    user,
	})
}
