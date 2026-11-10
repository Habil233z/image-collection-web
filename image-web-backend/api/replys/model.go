package replys

import (
	"image-web-backend/resources/database"
	"time"
)

type Database struct {
	DB *database.Postgres
}

type Reply struct {
	Id        int       `json:"id" db:"id"`
	CommentId int       `json:"comment_id" db:"comment_id"`
	UserId    int       `json:"user_id" db:"user_id"`
	Reply     string    `json:"reply" db:"reply"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// ReplyResponse includes the joined username field for frontend rendering
type ReplyResponse struct {
	Id        int       `json:"id" db:"id"`
	CommentId int       `json:"comment_id" db:"comment_id"`
	UserId    int       `json:"user_id" db:"user_id"`
	Username  string    `json:"username" db:"username"`
	Reply     string    `json:"reply" db:"reply"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
