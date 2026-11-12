package comments

import (
	"image-web-backend/resources/database"
	"time"
)

type Database struct {
	DB *database.Postgres
}

type Comments struct {
	ID        int       `json:"id" db:"id"`
	ImageID   int       `json:"image_id" db:"image_id"`
	UserID    int       `json:"user_id" db:"user_id"`
	Comment   string    `json:"comment" db:"comment"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	Username  string    `json:"username"`
}
