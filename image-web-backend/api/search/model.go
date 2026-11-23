package search

import (
	"image-web-backend/resources/database"
	"time"
)

const (
	imagePageSize = 20
	userPageSize  = 20
	tagLimit      = 10
)

type Database struct {
	DB *database.Postgres
}

type ImageResult struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	Title     string    `json:"title" db:"title"`
	ImageURL  string    `json:"image_url" db:"image_url"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	Username  string    `json:"username" db:"username"`
}

type UserResult struct {
	ID            int    `json:"id" db:"id"`
	Username      string `json:"username" db:"username"`
	AvatarURL     string `json:"avatar_url" db:"avatar_url"`
	FollowerCount int    `json:"follower_count"`
}

type TagResult struct {
	Tag   string `json:"tag"`
	Count int    `json:"count"`
}
