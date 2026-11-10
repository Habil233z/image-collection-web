package database

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Postgres struct {
	Pool       *pgxpool.Pool
	BucketName string
}

func Database() (*Postgres, error) {
	// Read DB_URL from .env (fallback to DATABASE_URL if needed)
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}

	if dbURL == "" {
		return nil, fmt.Errorf("DB_URL or DATABASE_URL environment variable is not set")
	}

	// Read Supabase Bucket Name from environment
	bucketName := os.Getenv("SUPABASE_BUCKET_NAME")
	if bucketName == "" {
		bucketName = "images" // Default fallback bucket name
	}

	// Parse configuration for pgx pool
	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database config: %w", err)
	}

	// Connect to the database
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Ping the database to verify the connection
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &Postgres{
		Pool:       pool,
		BucketName: bucketName,
	}, nil
}
