package social

import (
	"image-web-backend/resources/database"
	"time"
)

const (
	imagePageSize = 24
	userPageSize  = 30
)

type Database struct {
	DB *database.Postgres
}

type UserSummary struct {
	ID        int    `json:"id" db:"id"`
	Username  string `json:"username" db:"username"`
	AvatarURL string `json:"avatar_url" db:"avatar_url"`
}

type UserProfile struct {
	ID             int    `json:"id" db:"id"`
	Username       string `json:"username" db:"username"`
	AvatarURL      string `json:"avatar_url" db:"avatar_url"`
	ImageCount     int    `json:"image_count"`
	FollowerCount  int    `json:"follower_count"`
	FollowingCount int    `json:"following_count"`
	IsMe           bool   `json:"is_me"`
	IsFollowing    bool   `json:"is_following"`
	IsFollowedBy   bool   `json:"is_followed_by"`
}

type UserImage struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	Title     string    `json:"title" db:"title"`
	ImageURL  string    `json:"image_url" db:"image_url"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
