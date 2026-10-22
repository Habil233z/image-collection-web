package comments

import (
	"image-web-backend/resources/database"
	"time"
)

type Database struct {
	DB *database.Postgres
}

type Comments struct {
	Id         int       `json:"id"`
	Image_id   string    `json:"image_name"`
	User_id    string    `json:"user_id"`
	Comment    string    `json:"comment"`
	Created_at time.Time `json:"created_at"`
	Username   string    `json:"username"`
}
