"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/header"
import Avatar from "@/components/avatar"
import ImageMasonry from "@/components/image-masonry"
import api from "@/lib/api"
import { getStoredUsername } from "@/lib/auth"

type Kind = "images" | "users"

function SearchContent() {
    const router = useRouter()
    const params = useSearchParams()
    const q = (params.get("q") || "").trim()
    const tag = (params.get("tag") || "").trim()
    const kind: Kind = params.get("type") === "users" ? "users" : "images"

    const [username, setUsername] = useState<string | null>(null)
    const [input, setInput] = useState(tag ? `#${tag}` : q)
    const [items, setItems] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [relatedTags, setRelatedTags] = useState<{ tag: string; count: number }[]>([])
    const requestId = useRef(0)

    const hasQuery = q !== "" || tag !== ""

    useEffect(() => {
        setUsername(getStoredUsername())
    }, [])

    useEffect(() => {
        setInput(tag ? `#${tag}` : q)
    }, [q, tag])

    const load = useCallback(async (nextPage: number) => {
        if (!hasQuery) {
            setItems([])
            setHasMore(false)
            return
        }
        const myRequest = ++requestId.current
        setLoading(true)
        try {
            const query = new URLSearchParams({ page: String(nextPage) })
            if (q) query.set("q", q)
            if (tag && kind === "images") query.set("tag", tag)
            const res = await api.get(`search/${kind}?${query.toString()}`)
            if (myRequest !== requestId.current) return
            const data: any[] = res.data.data || []
            setItems((prev) => (nextPage === 1 ? data : [...prev, ...data]))
            setPage(nextPage)
            setHasMore(data.length >= (res.data.page_size || 20))
            setError(false)
        } catch (err) {
            if (myRequest !== requestId.current) return
            console.error("Search failed:", err)
            setError(true)
        } finally {
            if (myRequest === requestId.current) setLoading(false)
        }
    }, [q, tag, kind, hasQuery])

    useEffect(() => {
        setItems([])
        load(1)
    }, [load])

    useEffect(() => {
        let cancelled = false
        const text = q.replace(/^#/, "")
        api.get(`search/tags?q=${encodeURIComponent(text)}`)
            .then((res) => { if (!cancelled) setRelatedTags(res.data.data || []) })
            .catch(() => { if (!cancelled) setRelatedTags([]) })
        return () => { cancelled = true }
    }, [q])

    function go(next: { q?: string; tag?: string; type?: Kind }, replace = false) {
        const sp = new URLSearchParams()
        if (next.q) sp.set("q", next.q)
        if (next.tag) sp.set("tag", next.tag)
        if (next.type === "users") sp.set("type", "users")
        const url = `/search${sp.toString() ? `?${sp.toString()}` : ""}`
        if (replace) router.replace(url)
        else router.push(url)
    }

    function submit(e: React.FormEvent) {
        e.preventDefault()
        const value = input.trim()
        if (value.startsWith("#")) go({ tag: value.replace(/^#+/, ""), type: "images" })
        else go({ q: value, type: kind })
    }

    return (
        <div className="page-bg min-h-screen w-full flex flex-col">
            <Header username={username} />

            <main className="px-4 sm:px-8 pb-10 mx-auto w-full max-w-400">
                <section className="max-w-2xl mx-auto mt-2 mb-6">
                    <h2 className="text-center text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
                        Search
                    </h2>
                    <form onSubmit={submit} className="flex gap-2">
                        <input
                            type="search"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={kind === "users" ? "Search people by username" : "Search by title or #tag"}
                            aria-label="Search"
                            className="field text-base rounded-full!"
                            autoFocus={!hasQuery}
                        />
                        <button type="submit" className="bg-neutral-900 hover:bg-black text-white font-medium px-6 rounded-full shadow-md transition">
                            Search
                        </button>
                    </form>

                    <div role="tablist" className="glass-card rounded-full p-1.5 flex gap-1 mt-4">
                        {(["images", "users"] as Kind[]).map((k) => (
                            <button
                                key={k}
                                role="tab"
                                aria-selected={kind === k}
                                onClick={() => kind !== k && go({ q, tag: k === "images" ? tag : "", type: k }, true)}
                                className={`flex-1 rounded-full px-3 py-2 font-semibold transition ${kind === k ? "bg-neutral-900 text-white shadow-md" : "text-gray-600 hover:bg-white/70"}`}
                            >
                                {k === "images" ? "Images" : "People"}
                            </button>
                        ))}
                    </div>

                    {kind === "images" && (tag || relatedTags.length > 0) && (
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                            {tag && (
                                <button
                                    onClick={() => go({ q, type: "images" }, true)}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 text-white text-sm font-semibold pl-3 pr-2 py-1 shadow-sm"
                                    aria-label={`Clear tag filter ${tag}`}
                                >
                                    #{tag} <span className="h-4 w-4 rounded-full bg-white/25 flex items-center justify-center text-xs leading-none">×</span>
                                </button>
                            )}
                            {relatedTags.filter((t) => t.tag !== tag).map((t) => (
                                <Link
                                    key={t.tag}
                                    href={`/search?tag=${encodeURIComponent(t.tag)}`}
                                    className="rounded-full bg-white/80 hover:bg-white text-sky-700 text-sm font-medium px-3 py-1 shadow-xs transition"
                                >
                                    #{t.tag} <span className="text-gray-400 text-xs">{t.count}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {!hasQuery && (
                    <p className="text-center text-gray-600">
                        {kind === "users" ? "Type a username to find people." : "Type a title, or pick a tag above, to find images."}
                    </p>
                )}

                {hasQuery && loading && items.length === 0 && (
                    kind === "images" ? (
                        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4" aria-busy="true">
                            {[1.2, 0.8, 1, 1.4, 0.9, 1.1, 0.75, 1.3].map((ratio, i) => (
                                <div key={i} className="skeleton rounded-2xl mb-4 break-inside-avoid" style={{ aspectRatio: `1 / ${ratio}` }} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto" aria-busy="true">
                            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton rounded-2xl h-18" />)}
                        </div>
                    )
                )}

                {hasQuery && !loading && error && items.length === 0 && (
                    <div className="glass-card rounded-3xl p-8 max-w-md mx-auto text-center">
                        <p className="text-xl font-bold text-gray-800 mb-1">Something went wrong</p>
                        <p className="text-sm text-gray-500">Please try again in a moment.</p>
                    </div>
                )}

                {hasQuery && !loading && !error && items.length === 0 && (
                    <div className="glass-card rounded-3xl p-8 max-w-md mx-auto text-center">
                        <p className="text-xl font-bold text-gray-800 mb-1">No results</p>
                        <p className="text-sm text-gray-500">Nothing matched &ldquo;{tag ? `#${tag}` : q}&rdquo;. Try a different word or tag.</p>
                    </div>
                )}

                {items.length > 0 && kind === "images" && <ImageMasonry images={items} />}

                {items.length > 0 && kind === "users" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
                        {items.map((u, i) => (
                            <Link
                                key={u.id}
                                href={`/user/${u.id}`}
                                className="tile-in glass-card rounded-2xl p-3 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-xl transition"
                                style={{ animationDelay: `${Math.min(i, 20) * 30}ms` }}
                            >
                                <Avatar src={u.avatar_url} alt={u.username} className="h-12 w-12" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-800 truncate">{u.username}</p>
                                    <p className="text-xs text-gray-500">{u.follower_count} follower{u.follower_count === 1 ? "" : "s"}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {hasMore && (
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => load(page + 1)}
                            disabled={loading}
                            className="bg-neutral-900 hover:bg-black text-white font-medium px-6 py-2.5 rounded-full shadow-md transition disabled:opacity-60"
                        >
                            {loading ? "Loading..." : "Load more"}
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={null}>
            <SearchContent />
        </Suspense>
    )
}
