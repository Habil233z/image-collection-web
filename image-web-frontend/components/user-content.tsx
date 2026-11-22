"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import api from "@/lib/api"
import Avatar from "@/components/avatar"

export type Tab = "images" | "followers" | "following"

export interface Counts {
    images: number
    followers: number
    following: number
}

const TABS: { key: Tab; label: string }[] = [
    { key: "images", label: "Images" },
    { key: "followers", label: "Followers" },
    { key: "following", label: "Following" },
]

const EMPTY: Record<Tab, { title: string; hint: string }> = {
    images: { title: "No images yet", hint: "Uploaded images will appear here." },
    followers: { title: "No followers yet", hint: "People who follow this account will appear here." },
    following: { title: "Not following anyone yet", hint: "Accounts this user follows will appear here." },
}

export default function UserContent({
    userId,
    counts,
    refreshKey = 0,
}: {
    userId: number
    counts: Counts
    refreshKey?: number
}) {
    const [tab, setTab] = useState<Tab>("images")
    const [items, setItems] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const requestId = useRef(0)

    const load = useCallback(async (nextPage: number) => {
        const myRequest = ++requestId.current
        setLoading(true)
        try {
            const path = tab === "images" ? "images" : tab
            const res = await api.get(`users/${userId}/${path}?page=${nextPage}`)
            if (myRequest !== requestId.current) return
            const data: any[] = res.data.data || []
            setItems((prev) => (nextPage === 1 ? data : [...prev, ...data]))
            setPage(nextPage)
            setHasMore(data.length >= (res.data.page_size || 20))
            setError(false)
        } catch (err) {
            if (myRequest !== requestId.current) return
            console.error("Failed to load user list:", err)
            setError(true)
        } finally {
            if (myRequest === requestId.current) setLoading(false)
        }
    }, [tab, userId])

    useEffect(() => {
        load(1)
    }, [load, refreshKey])

    function switchTab(next: Tab) {
        if (next === tab) return
        setItems([])
        setHasMore(false)
        setLoading(true)
        setTab(next)
    }

    return (
        <section className="w-full">
            <div role="tablist" className="glass-card rounded-full p-1.5 flex gap-1 w-full max-w-xl mx-auto mb-6">
                {TABS.map(({ key, label }) => {
                    const active = tab === key
                    return (
                        <button
                            key={key}
                            role="tab"
                            aria-selected={active}
                            onClick={() => switchTab(key)}
                            className={`flex-1 rounded-full px-3 py-2 text-sm sm:text-base font-semibold transition ${active ? "bg-neutral-900 text-white shadow-md" : "text-gray-600 hover:bg-white/70"}`}
                        >
                            <span className="font-extrabold">{counts[key]}</span> {label}
                        </button>
                    )
                })}
            </div>

            {loading && items.length === 0 && (
                tab === "images" ? (
                    <div className="columns-2 sm:columns-3 md:columns-4 gap-4" aria-busy="true">
                        {[1.2, 0.8, 1, 1.4, 0.9, 1.1, 0.75, 1.3].map((ratio, i) => (
                            <div key={i} className="skeleton rounded-2xl mb-4 break-inside-avoid" style={{ aspectRatio: `1 / ${ratio}` }} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-busy="true">
                        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton rounded-2xl h-18" />)}
                    </div>
                )
            )}

            {!loading && error && items.length === 0 && (
                <div className="glass-card rounded-3xl p-8 max-w-md mx-auto text-center">
                    <p className="text-xl font-bold text-gray-800 mb-1">Something went wrong</p>
                    <p className="text-sm text-gray-500">Please try again in a moment.</p>
                </div>
            )}

            {!loading && !error && items.length === 0 && (
                <div className="glass-card rounded-3xl p-8 max-w-md mx-auto text-center">
                    <p className="text-xl font-bold text-gray-800 mb-1">{EMPTY[tab].title}</p>
                    <p className="text-sm text-gray-500">{EMPTY[tab].hint}</p>
                </div>
            )}

            {items.length > 0 && tab === "images" && (
                <div className="columns-2 sm:columns-3 md:columns-4 gap-4">
                    {items.map((image, i) => (
                        <Link
                            key={image.id}
                            href={`/image/${image.id}`}
                            className="tile-in group relative block mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-white/50 shadow-md hover:shadow-2xl hover:shadow-sky-900/25 hover:-translate-y-1 transition duration-300"
                            style={{ animationDelay: `${Math.min(i, 20) * 35}ms` }}
                        >
                            <img src={image.image_url} alt={image.title} loading="lazy" className="block w-full h-auto transition duration-500 group-hover:scale-[1.04]" />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-sky-950/75 via-sky-950/30 to-transparent px-3 pt-10 pb-2.5 opacity-0 group-hover:opacity-100 transition duration-300">
                                <p className="text-white text-sm font-semibold truncate">{image.title}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {items.length > 0 && tab !== "images" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((u, i) => (
                        <Link
                            key={u.id}
                            href={`/user/${u.id}`}
                            className="tile-in glass-card rounded-2xl p-3 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-xl transition"
                            style={{ animationDelay: `${Math.min(i, 20) * 30}ms` }}
                        >
                            <Avatar src={u.avatar_url} alt={u.username} className="h-12 w-12" />
                            <span className="font-semibold text-gray-800 truncate">{u.username}</span>
                        </Link>
                    ))}
                </div>
            )}

            {hasMore && (
                <div className="flex justify-center mt-6 pb-6">
                    <button
                        onClick={() => load(page + 1)}
                        disabled={loading}
                        className="bg-neutral-900 hover:bg-black text-white font-medium px-6 py-2.5 rounded-full shadow-md transition disabled:opacity-60"
                    >
                        {loading ? "Loading..." : "Load more"}
                    </button>
                </div>
            )}
        </section>
    )
}
