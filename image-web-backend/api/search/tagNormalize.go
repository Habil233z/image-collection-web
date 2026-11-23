package search

import (
	"strings"
	"unicode"
)

func normalizeTag(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.TrimLeft(s, "#")

	var b strings.Builder
	for _, r := range s {
		switch {
		case unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_' || r == '-':
			b.WriteRune(r)
		case unicode.IsSpace(r):
			b.WriteRune('-')
		}
	}
	return strings.Trim(b.String(), "-")
}
