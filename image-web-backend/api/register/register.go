package register

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type RegisterInput struct {
	Id       int    `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

func Register(c *gin.Context) {
	var input RegisterInput

	if err := c.BindJSON(&input); err != nil {
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Success",
		"data":    input,
	})
}
