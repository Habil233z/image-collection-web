package main

import (
	"image-web-backend/api/auth"
	"image-web-backend/api/images"
	"log"
	"time"

	"image-web-backend/resources/database"
	"image-web-backend/resources/middleware/authMiddleware"

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

	authHandlers := &auth.Database{DB: db}
	imageHandlers := &images.Database{DB: db}

	router := gin.Default()
	router.Static("/uploads", "./uploads")
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

	router.POST("/register", authHandlers.Register)
	router.POST("/login", authHandlers.Login)

	router.GET("/images", imageHandlers.Images)

	api := router.Group("/api")
	api.Use(authMiddleware.AuthMiddleware())
	{
		api.GET("/profile", authHandlers.Profile)
		api.POST("/upload", imageHandlers.UploadImage)
	}

	router.Run("localhost:8080")
}
