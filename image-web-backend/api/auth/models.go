package auth

import (
	"image-web-backend/resources/database"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Database struct {
	DB *database.Postgres
}

type User struct {
	ID        int       `json:"id" db:"id"`
	Username  string    `json:"username" db:"username"`
	Email     string    `json:"email" db:"email"`
	Password  string    `json:"password,omitempty" db:"password"`
	AvatarURL string    `json:"avatar_url" db:"avatar_url"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type LoginInput struct {
	EmailOrUsername string `json:"emailOrUsername"`
	Password        string `json:"password"`
}

type CustomClaims struct {
	Id       int    `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}
