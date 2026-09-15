package main

import (
	"image-web-backend/api/login"
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

	registerHandler := &register.Database{DB: db}
	loginHandler := &login.Database{DB: db}

	router := gin.Default()
	router.POST("/register", registerHandler.Register)
	router.POST("/login", loginHandler.Login)
	router.Run("localhost:8080")
}
