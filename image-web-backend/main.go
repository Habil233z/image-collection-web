package main

import (
	"image-web-backend/api/register"
	"log"

	"image-web-backend/resources/database"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Error loading .env file")
	}

	db, err := database.Database()
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Pool.Close()

	handler := &register.Database{DB: db}

	router := gin.Default()
	router.POST("/register", handler.Register)
	router.Run("localhost:8080")
}
