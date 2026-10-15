package auth

import (
	"image-web-backend/resources/database"

	"github.com/golang-jwt/jwt/v5"
)

type LoginInput struct {
	EmailOrUsername string `json:"emailOrUsername"`
	Password        string `json:"password"`
}

type RegisterInput struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type User struct {
	Id       int    `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password,omitempty"`
}

type CustomClaims struct {
	Id       int    `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

type Database struct {
	DB *database.Postgres
}
