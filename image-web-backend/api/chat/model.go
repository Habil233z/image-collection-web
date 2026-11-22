package chat

import (
	"image-web-backend/resources/database"
	"time"
)

const (
	maxBodyRunes  = 2000
	messageWindow = 200
)

type Database struct {
	DB *database.Postgres
}

type Message struct {
	ID        int        `json:"id" db:"id"`
	SenderID  int        `json:"sender_id" db:"sender_id"`
	Body      string     `json:"body" db:"body"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	EditedAt  *time.Time `json:"edited_at" db:"edited_at"`
	Mine      bool       `json:"mine"`
	Read      bool       `json:"read"`
}

type Partner struct {
	ID        int    `json:"id" db:"id"`
	Username  string `json:"username" db:"username"`
	AvatarURL string `json:"avatar_url" db:"avatar_url"`
}

type Conversation struct {
	Partner     Partner   `json:"partner"`
	LastMessage string    `json:"last_message"`
	LastMine    bool      `json:"last_mine"`
	LastAt      time.Time `json:"last_at"`
	Unread      int       `json:"unread"`
}

type MessageInput struct {
	Body string `json:"body"`
}
