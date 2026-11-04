package replys

import (
	"image-web-backend/resources/database"
	"time"
)

type Database struct {
	DB *database.Postgres
}

type ReplyResponse struct {
	Id        int       `json:"id"`
	CommentId int       `json:"comment_id"`
	UserId    int       `json:"user_id"`
	Username  string    `json:"username"`
	Reply     string    `json:"reply"`
	CreatedAt time.Time `json:"created_at"`
}
