package auth

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	storage_go "github.com/supabase-community/storage-go"
)

const maxAvatarBytes = 5 << 20 // 5 MB (the frontend already resizes avatars to <= 512px)

var allowedAvatarTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
}

// EditProfile updates username / email and, optionally, the avatar.
//
// Multipart fields:
//   - username, email  (required, as before)
//   - avatarFile       (optional) a new avatar image -> uploaded, replaces the old one
//   - removeAvatar     (optional) "true" -> delete the current avatar
func (d *Database) EditProfile(c *gin.Context) {
	username := c.PostForm("username")
	email := c.PostForm("email")

	token, exists := c.Get("auth_token")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: User data not found"})
		return
	}

	claims, ok := token.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user claims"})
		return
	}

	idFloat, ok := claims["id"].(float64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID claim type"})
		return
	}
	Id := int(idFloat)

	ctx := c.Request.Context()

	// Current avatar (needed to clean up the old file afterwards)
	var oldAvatar string
	if err := d.DB.Pool.QueryRow(ctx, "SELECT COALESCE(avatar_url, '') FROM users WHERE id = $1", Id).Scan(&oldAvatar); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Rows not found",
			"message": "User doesn't exist",
		})
		return
	}
	newAvatar := oldAvatar
	uploadedPath := ""

	if fileHeader, err := c.FormFile("avatarFile"); err == nil {
		if fileHeader.Size > maxAvatarBytes {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Avatar must be 5 MB or smaller"})
			return
		}
		file, err := fileHeader.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open avatar file"})
			return
		}
		defer file.Close()

		// Sniff the real content type instead of trusting the client header
		head := make([]byte, 512)
		n, _ := file.Read(head)
		contentType := http.DetectContentType(head[:n])
		ext, allowed := allowedAvatarTypes[contentType]
		if !allowed {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Avatar must be a JPG, PNG, WEBP or GIF image"})
			return
		}
		if _, err := file.Seek(0, 0); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read avatar file"})
			return
		}

		uploadedPath = fmt.Sprintf("avatars/%d_%d%s", Id, time.Now().UnixNano(), ext)
		_, err = d.SupabaseClient.UploadFile(d.AvatarBucket, uploadedPath, file, storage_go.FileOptions{
			ContentType: &contentType,
			Upsert:      boolPtr(false),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload avatar"})
			return
		}
		newAvatar = fmt.Sprintf("%s/storage/v1/object/public/%s/%s", os.Getenv("SUPABASE_URL"), d.AvatarBucket, uploadedPath)
	} else if c.PostForm("removeAvatar") == "true" {
		newAvatar = ""
	}

	tag, err := d.DB.Pool.Exec(ctx, "UPDATE users SET username = $1, email = $2, avatar_url = $3 WHERE id = $4", username, email, newAvatar, Id)
	if err != nil {
		println("[Profile Error] DB Update failed:", err.Error())
		if uploadedPath != "" {
			_, _ = d.SupabaseClient.RemoveFile(d.AvatarBucket, []string{uploadedPath})
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	if tag.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Rows not found",
			"message": "User doesn't exist",
		})
		return
	}

	// The old file is no longer referenced: delete it (best effort)
	if oldAvatar != "" && oldAvatar != newAvatar {
		if oldPath := storagePathFromURL(oldAvatar, d.AvatarBucket); oldPath != "" {
			_, _ = d.SupabaseClient.RemoveFile(d.AvatarBucket, []string{oldPath})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Profile updated successfully",
		"avatar_url": newAvatar,
	})
}

// storagePathFromURL turns ".../object/public/<bucket>/avatars/3_123.png" into "avatars/3_123.png".
func storagePathFromURL(url, bucket string) string {
	marker := "/object/public/" + bucket + "/"
	idx := strings.Index(url, marker)
	if idx == -1 {
		return ""
	}
	return url[idx+len(marker):]
}

func boolPtr(b bool) *bool { return &b }
