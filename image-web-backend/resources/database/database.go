package database

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

type Postgres struct {
	Pool *pgxpool.Pool
}

func Database() (*Postgres, error) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	connStr := os.Getenv("DATABASE")

	pool, err := pgxpool.New(context.Background(), connStr)
	if err != nil {
		log.Fatalf("unable to connect to database: %v", err)
	}

	return &Postgres{Pool: pool}, nil
}
