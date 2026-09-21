package register

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

type RegisterInput struct {
	Id       int    `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *Database) Register(c *gin.Context) {
	err := godotenv.Load()
	var input RegisterInput

	if err := c.BindJSON(&input); err != nil {
		return
	}

	_, err = h.DB.Pool.Query(context.Background(), "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", input.Email, input.Username, input.Password)
	if err != nil {
		log.Fatalf("error inserting user: %v", err)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Success",
		"data":    input.Username,
	})
}
