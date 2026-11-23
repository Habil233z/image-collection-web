package images

import (
	"strings"
	"unicode"
)

const (
	maxTags     = 10
	maxTagRunes = 30
)

func parseTags(raw []string) []string {
	tags := []string{}
	seen := map[string]bool{}

	for _, chunk := range raw {
		for _, part := range strings.Split(chunk, ",") {
			part = strings.ToLower(strings.TrimSpace(part))
			part = strings.TrimLeft(part, "#")

			var b strings.Builder
			for _, r := range part {
				switch {
				case unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_' || r == '-':
					b.WriteRune(r)
				case unicode.IsSpace(r):
					b.WriteRune('-')
				}
			}

			tag := strings.Trim(b.String(), "-")
			for strings.Contains(tag, "--") {
				tag = strings.ReplaceAll(tag, "--", "-")
			}
			if r := []rune(tag); len(r) > maxTagRunes {
				tag = strings.Trim(string(r[:maxTagRunes]), "-")
			}

			if tag == "" || seen[tag] {
				continue
			}
			seen[tag] = true
			tags = append(tags, tag)
			if len(tags) == maxTags {
				return tags
			}
		}
	}
	return tags
}
