package main

import (
	"image-web-backend/api/auth"
	"image-web-backend/api/comments"
	"image-web-backend/api/images"
	"image-web-backend/api/likes"
	"image-web-backend/api/replys"

	"log"
	"os"
	"time"

	"image-web-backend/resources/database"
	"image-web-backend/resources/middleware/authMiddleware"
	"image-web-backend/resources/supabase" // Import your new supabase package

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	db, err := database.Database()
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Pool.Close()

	// Initialize Supabase Storage Client
	supabaseClient := supabase.NewStorageClient()
	bucketName := os.Getenv("SUPABASE_BUCKET_NAME")
	if bucketName == "" {
		bucketName = "images" // fallback bucket name
	}

	authHandlers := &auth.Database{DB: db}

	// Inject Supabase client and bucket name into image handlers
	imageHandlers := &images.Database{
		DB:             db,
		SupabaseClient: supabaseClient,
		BucketName:     bucketName,
	}

	commentHandlers := &comments.Database{DB: db}
	likeHandlers := &likes.Database{DB: db}
	replyHandlers := &replys.Database{DB: db}

	router := gin.Default()

	// REMOVED: router.Static("/uploads", "./uploads") -> No longer needed as images are stored in Supabase

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"}, // Fixed capitalization for Content-Type
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			// FIXED: Allow your frontend development server URL test
			return origin == "http://localhost:3000"
		},
		MaxAge: 12 * time.Hour,
	}))

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

		api.POST("/image/:id/comments", commentHandlers.PostComment)
		api.PATCH("/image/:id/comment/:commentId", commentHandlers.EditComment)
		api.DELETE("/image/:id/comment/:commentId", commentHandlers.DeleteComment)

		api.POST("/image/:id/comment/:commentId/like", likeHandlers.ToggleLikeComment)

		api.POST("/image/:id/comment/:commentId/reply", replyHandlers.PostReply)
		api.PATCH("/image/:id/comment/:commentId/reply/:replyId", replyHandlers.EditReply)
		api.DELETE("/image/:id/comment/:commentId/reply/:replyId", replyHandlers.DeleteReply)
		api.POST("/image/:id/comment/:commentId/reply/:replyId/like", likeHandlers.ToggleLikeReply)
	}

	router.Run("localhost:8080")
}
