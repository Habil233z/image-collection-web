package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"image-web-backend/api/auth"
	"image-web-backend/api/comments"
	"image-web-backend/api/images"
	"image-web-backend/api/likes"
	"image-web-backend/api/replys"
	"image-web-backend/resources/database"
	"image-web-backend/resources/middleware/authMiddleware"
	"image-web-backend/resources/supabase"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Use ginadapter.GinLambda instead of ginadapter.GinAdapter
var ginLambda *ginadapter.GinLambda
var router *gin.Engine

func init() {
	router = gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "https://image-collection-web.vercel.app"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

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

	authHandlers := &auth.Database{DB: db}
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

		api.POST("/image/:id/comments", commentHandlers.PostComment)
		api.PATCH("/image/:id/comment/:commentId", commentHandlers.EditComment)
		api.DELETE("/image/:id/comment/:commentId", commentHandlers.DeleteComment)

		api.POST("/image/:id/comment/:commentId/like", likeHandlers.ToggleLikeComment)

		api.POST("/image/:id/comment/:commentId/reply", replyHandlers.PostReply)
		api.PATCH("/image/:id/comment/:commentId/reply/:replyId", replyHandlers.EditReply)
		api.DELETE("/image/:id/comment/:commentId/reply/:replyId", replyHandlers.DeleteReply)
		api.POST("/image/:id/comment/:commentId/reply/:replyId/like", likeHandlers.ToggleLikeReply)
	}

	ginLambda = ginadapter.New(router)
}

func Handler(req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return ginLambda.Proxy(req)
}

func main() {
	if os.Getenv("AWS_LAMBDA_FUNCTION_NAME") == "" {
		log.Println("Running server locally on :8080")
		if err := router.Run(":8080"); err != nil {
			log.Fatalf("Local server failed: %v", err)
		}
		return
	}

	lambda.Start(Handler)
}
