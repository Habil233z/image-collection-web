package explore

import (
	"image-web-backend/resources/database"
	"time"
)

const pageSize = 20

type Database struct {
	DB *database.Postgres
}

type ExploreImage struct {
	ID            int       `json:"id" db:"id"`
	UserID        int       `json:"user_id" db:"user_id"`
	Title         string    `json:"title" db:"title"`
	ImageURL      string    `json:"image_url" db:"image_url"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	Username      string    `json:"username" db:"username"`
	Score         int       `json:"score"`
	ReasonTag     string    `json:"reason_tag"`
	LikedUploader bool      `json:"liked_uploader"`
}
