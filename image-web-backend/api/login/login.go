package login

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"

	"image-web-backend/resources/database"

	"github.com/gin-gonic/gin"
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

	c.JSON(http.StatusOK, gin.H{
		"message": "Login Success",
		"data":    user,
	})
}
