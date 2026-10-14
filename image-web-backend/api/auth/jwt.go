package auth

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func CreateToken(id int, email string, username string) (string, error) {
	secretKey := []byte(os.Getenv("SECRET_KEY"))
	claims := CustomClaims{
		Id:       id,
		Email:    email,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "Image-Web",
			Subject:   "authentication",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secretKey)
}
