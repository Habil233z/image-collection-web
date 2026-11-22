package main

import (
	"log"
	"net/http"
	"os"

	"image-web-backend/api/auth"
	"image-web-backend/api/comments"
	"image-web-backend/api/images"
	"image-web-backend/api/likes"
	"image-web-backend/api/replys"
	"image-web-backend/resources/database"
	"image-web-backend/resources/middleware/authMiddleware"
	"image-web-backend/resources/supabase"

	"github.com/gin-gonic/gin"
)

var router *gin.Engine

// Bulletproof CORS Middleware that works reliably on Vercel serverless
func BulletproofCORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		// If the request comes from localhost or your Vercel frontend, echo it back
		if origin == "http://localhost:3000" || origin == "http://127.0.0.1:3000" || origin == "https://image-collection-web.vercel.app" {
			c.Header("Access-Control-Allow-Origin", origin)
		} else {
			// Fallback production default
			c.Header("Access-Control-Allow-Origin", "https://image-collection-web.vercel.app")
		}

		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		// Handle preflight OPTIONS requests immediately
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func init() {
	router = gin.Default()

	// Replace gin-contrib/cors with the bulletproof middleware
	router.Use(BulletproofCORS())

	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	db, err := database.Database()
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}

	// Initialize Supabase Storage Client
	supabaseClient := supabase.NewStorageClient()
	bucketName := os.Getenv("SUPABASE_BUCKET_NAME")
	if bucketName == "" {
		bucketName = "images"
	}

	// Avatars live in their own bucket when SUPABASE_AVATAR_BUCKET is set,
	// otherwise they share the images bucket (under an "avatars/" folder).
	avatarBucket := os.Getenv("SUPABASE_AVATAR_BUCKET")
	if avatarBucket == "" {
		avatarBucket = bucketName
	}

	authHandlers := &auth.Database{
		DB:             db,
		SupabaseClient: supabaseClient,
		AvatarBucket:   avatarBucket,
	}
	imageHandlers := &images.Database{
		DB:             db,
		SupabaseClient: supabaseClient,
		BucketName:     bucketName,
	}
	commentHandlers := &comments.Database{DB: db}
	likeHandlers := &likes.Database{DB: db}
	replyHandlers := &replys.Database{DB: db}

	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Hello World",
		})
	})

	router.POST("/register", authHandlers.Register)
	router.POST("/login", authHandlers.Login)
	router.POST("/logout", authHandlers.Logout)

	router.GET("/images", imageHandlers.Images)
	router.GET("/image/:id", imageHandlers.ImageDetail)
	router.GET("/image/:id/likes", likeHandlers.GetLikeImage)

	router.GET("/image/:id/comments", commentHandlers.GetComments)
	router.GET("/image/:id/comment/:commentId/likes", likeHandlers.GetLikeComment)

	router.GET("/image/:id/comment/:commentId/replies", replyHandlers.GetReplies)
	router.GET("/image/:id/comment/:commentId/replies/:replyId/likes", likeHandlers.GetLikeReply)
	router.GET("/image/:id/comment/:commentId/replies/count", replyHandlers.GetReplyCount)

	api := router.Group("/api")
	api.Use(authMiddleware.AuthMiddleware())
	{
		api.GET("/profile", authHandlers.Profile)
		api.PATCH("/profile", authHandlers.EditProfile)
		api.POST("/upload", imageHandlers.UploadImage)
		api.PATCH("/image/:id", imageHandlers.EditImage)
		api.DELETE("/image/:id", imageHandlers.DeleteImage)

		api.POST("/image/:id/like", likeHandlers.ToggleLike)
		api.GET("/liked-images", likeHandlers.GetLikedImages)

		api.POST("/image/:id/comments", commentHandlers.PostComment)
		api.PATCH("/image/:id/comment/:commentId", commentHandlers.EditComment)
		api.DELETE("/image/:id/comment/:commentId", commentHandlers.DeleteComment)

		api.POST("/image/:id/comment/:commentId/like", likeHandlers.ToggleLikeComment)

		api.POST("/image/:id/comment/:commentId/reply", replyHandlers.PostReply)
		api.PATCH("/image/:id/comment/:commentId/reply/:replyId", replyHandlers.EditReply)
		api.DELETE("/image/:id/comment/:commentId/reply/:replyId", replyHandlers.DeleteReply)
		api.POST("/image/:id/comment/:commentId/reply/:replyId/like", likeHandlers.ToggleLikeReply)
	}
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Listening and serving HTTP on localhost:%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
