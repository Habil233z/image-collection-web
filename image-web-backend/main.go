package main

import (
	"image-web-backend/api/auth/login"
	"image-web-backend/api/auth/profile"
	"image-web-backend/api/auth/register"
	"log"
	"time"

	"image-web-backend/resources/database"
	"image-web-backend/resources/middleware/auth"

	"github.com/gin-contrib/cors"
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
	profileHandler := &profile.Database{DB: db}

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "content-type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			return origin == "https://github.com"
		},
		MaxAge: 12 * time.Hour,
	}))

	router.POST("/register", registerHandler.Register)
	router.POST("/login", loginHandler.Login)

	api := router.Group("/api")
	api.Use(auth.AuthMiddleware())
	{
		api.GET("/profile", profileHandler.Profile)
	}

	router.Run("localhost:8080")
}
