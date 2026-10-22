package images

import (
	"image-web-backend/resources/database"
	"time"
)

type User struct {
	Id       int    `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
}

type Images struct {
	Id         int       `json:"id"`
	Image_name string    `json:"image_name"`
	User_id    string    `json:"user_id"`
	Created_at time.Time `json:"created_at"`
	Image_path string    `json:"image_path"`
}

type ImageDetail struct {
	Id         int       `json:"id"`
	Image_name string    `json:"image_name"`
	User_id    string    `json:"user_id"`
	Created_at time.Time `json:"created_at"`
	Image_path string    `json:"image_path"`
	Username   string    `json:"username"`
}

type Database struct {
	DB *database.Postgres
}
