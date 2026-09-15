package login

import (
	"context"
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
	Id       int    `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type User struct {
	Id       int    `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
}

func (h *Database) Login(c *gin.Context) {
	err := godotenv.Load()
	var input LoginInput
	var user User

	if err := c.BindJSON(&input); err != nil {
		return
	}

	err = h.DB.Pool.QueryRow(context.Background(), "SELECT id, email, username FROM users WHERE username = $1", input.Username).Scan(&user.Id, &user.Username, &user.Email)
	if err != nil {
		log.Fatalf("error finding user: %v", err)
	}

	c.JSON(http.StatusFound, gin.H{
		"message": "Login Success",
		"data":    user,
	})
}
