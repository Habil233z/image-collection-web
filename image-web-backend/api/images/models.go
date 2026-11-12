package images

import (
	"image-web-backend/resources/database"
	"time"

	storage_go "github.com/supabase-community/storage-go"
)

type Database struct {
	DB             *database.Postgres
	SupabaseClient *storage_go.Client
	BucketName     string
}

type Image struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	Title     string    `json:"title" db:"title"`
	ImageURL  string    `json:"image_url" db:"image_url"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	Username  string    `json:"username" db:"username"`
}
