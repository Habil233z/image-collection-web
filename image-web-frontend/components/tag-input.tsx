"use client"

import { useEffect, useRef, useState } from "react"
import api from "@/lib/api"

export const MAX_TAGS = 10

export function normalizeTag(raw: string): string {
    return raw
        .toLowerCase()
        .trim()
        .replace(/^#+/, "")
        .replace(/\s+/g, "-")
        .replace(/[^\p{L}\p{N}_-]/gu, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 30)
}

export default function TagInput({
    tags,
    onChange,
}: {
    tags: string[]
    onChange: (tags: string[]) => void
}) {
    const [draft, setDraft] = useState("")
    const [suggestions, setSuggestions] = useState<{ tag: string; count: number }[]>([])
    const [focused, setFocused] = useState(false)
    const requestId = useRef(0)

    function addTag(raw: string) {
        const tag = normalizeTag(raw)
        if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return
        onChange([...tags, tag])
    }

    function commitDraft() {
        if (draft.trim()) addTag(draft)
        setDraft("")
    }

    useEffect(() => {
        const q = normalizeTag(draft)
        if (!focused || !q) {
            setSuggestions([])
            return
        }
        const myRequest = ++requestId.current
        const timer = setTimeout(async () => {
            try {
                const res = await api.get(`search/tags?q=${encodeURIComponent(q)}`)
                if (myRequest === requestId.current) setSuggestions(res.data.data || [])
            } catch {
                if (myRequest === requestId.current) setSuggestions([])
            }
        }, 200)
        return () => clearTimeout(timer)
    }, [draft, focused])

    const visibleSuggestions = suggestions.filter((s) => !tags.includes(s.tag))

    return (
        <div className="w-full">
            <div className="field flex flex-wrap items-center gap-1.5 py-2!">
                {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-sky-100 text-sky-700 text-sm font-medium pl-3 pr-1.5 py-0.5">
                        #{tag}
                        <button
                            type="button"
                            onClick={() => onChange(tags.filter((t) => t !== tag))}
                            aria-label={`Remove tag ${tag}`}
                            className="h-5 w-5 rounded-full hover:bg-sky-200 flex items-center justify-center leading-none"
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={draft}
                    disabled={tags.length >= MAX_TAGS}
                    onChange={(e) => {
                        const value = e.target.value
                        if (value.includes(",")) {
                            value.split(",").slice(0, -1).forEach(addTag)
                            setDraft(value.split(",").pop() ?? "")
                        } else {
                            setDraft(value)
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            commitDraft()
                        } else if (e.key === "Backspace" && !draft && tags.length > 0) {
                            onChange(tags.slice(0, -1))
                        }
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => {
                        setFocused(false)
                        commitDraft()
                    }}
                    placeholder={tags.length >= MAX_TAGS ? "Tag limit reached" : tags.length ? "Add another…" : "Add tags (press Enter)"}
                    className="flex-1 min-w-32 bg-transparent text-black text-base outline-none py-0.5"
                />
            </div>

            {focused && visibleSuggestions.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {visibleSuggestions.map((s) => (
                        <button
                            key={s.tag}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault()
                                addTag(s.tag)
                                setDraft("")
                            }}
                            className="rounded-full border border-gray-200 bg-white/80 hover:bg-sky-50 text-gray-600 text-xs px-2.5 py-1 transition"
                        >
                            #{s.tag} <span className="text-gray-400">{s.count}</span>
                        </button>
                    ))}
                </div>
            )}
            <p className="text-xs text-gray-400 mt-1.5 px-1">{tags.length}/{MAX_TAGS} tags</p>
        </div>
    )
}
