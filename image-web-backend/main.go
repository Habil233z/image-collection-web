package main

import (
	"image-web-backend/api/login"
	"image-web-backend/api/register"
	"log"
	"net/http"
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

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
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
		api.GET("/profile", func(c *gin.Context) {
			userData, exists := c.Get("userData")
			if !exists {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Data user tidak ditemukan di context"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message": "Akses berhasil!",
				"user":    userData,
			})
		})
	}

	router.Run("localhost:8080")
}
