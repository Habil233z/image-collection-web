package main

import (
	"context"
	"log"

	"image-web-backend/api/register"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	connStr := "postgres://postgres:habil@localhost:5432/test?sslmode=disable"

	pool, err := pgxpool.New(context.Background(), connStr)
	if err != nil {
		log.Fatalf("unable to connect to database: %v", err)
	}
	defer pool.Close()

	_, err = pool.Exec(context.Background(), "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", "first@gmail.com", "firstman", "firstpassword")
	if err != nil {
		log.Fatalf("error inserting user: %v", err)
	}
	router := gin.Default()
	router.POST("/register", register.Register)
	router.Run("localhost:8080")
}
