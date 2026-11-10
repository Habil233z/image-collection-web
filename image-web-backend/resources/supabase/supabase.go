package supabase

import (
	"os"

	storage_go "github.com/supabase-community/storage-go"
)

func NewStorageClient() *storage_go.Client {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY") // or SUPABASE_SERVICE_ROLE_KEY

	// CRITICAL: The URL MUST end with /storage/v1, otherwise the client hits the wrong endpoint!
	storageURL := supabaseURL + "/storage/v1"

	return storage_go.NewClient(storageURL, supabaseKey, map[string]string{
		"Authorization": "Bearer " + supabaseKey,
	})
}
