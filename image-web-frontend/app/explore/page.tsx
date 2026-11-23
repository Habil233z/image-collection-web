"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Header from "@/components/header"
import ImageMasonry from "@/components/image-masonry"
import api from "@/lib/api"
import { getStoredUsername, loginUrl } from "@/lib/auth"

export default function Explore() {
    const [username, setUsername] = useState<string | null>(null)
    const [images, setImages] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [hasLikes, setHasLikes] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const load = useCallback(async (nextPage: number) => {
        setLoading(true)
        try {
            const res = await api.get(`explore?page=${nextPage}`)
            const data: any[] = res.data.data || []
            setImages((prev) => (nextPage === 1 ? data : [...prev, ...data]))
            setPage(nextPage)
            setHasMore(data.length >= (res.data.page_size || 20))
            setHasLikes(!!res.data.has_likes)
            setError(false)
        } catch (err) {
            console.error("Failed to load explore:", err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        setUsername(getStoredUsername())
        load(1)
    }, [load])

    function badge(image: any) {
        if (image.liked_uploader) return `♥ More from ${image.username}`
        if (image.reason_tag) return `#${image.reason_tag}`
        return null
    }

    return (
        <div className="page-bg min-h-screen w-full flex flex-col">
            <Header username={username} />

            <main className="px-4 sm:px-8 pb-10 mx-auto w-full max-w-400">
                <section className="text-center mb-8 mt-2">
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
                        Explore <span className="bg-linear-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">for you</span>
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-gray-600">
                        {username
                            ? hasLikes
                                ? "Picked from the tags and creators of images you've liked."
                                : "Like a few images and this page will start matching your taste. Meanwhile, here's what's popular."
                            : <>Showing popular images. <Link href={loginUrl("/explore")} className="font-semibold text-sky-700 hover:underline">Log in</Link> to get recommendations based on your likes.</>}
                    </p>
                </section>

                {loading && images.length === 0 && (
                    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4" aria-busy="true">
                        {[1.2, 0.8, 1, 1.4, 0.9, 1.1, 0.75, 1.3, 1, 0.85].map((ratio, i) => (
                            <div key={i} className="skeleton rounded-2xl mb-4 break-inside-avoid" style={{ aspectRatio: `1 / ${ratio}` }} />
                        ))}
                    </div>
                )}

                {!loading && error && images.length === 0 && (
                    <div className="flex justify-center">
                        <div className="glass-card p-8 rounded-3xl max-w-md text-center">
                            <p className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</p>
                            <p className="text-sm text-gray-500">We couldn&apos;t load recommendations. Please try again.</p>
                        </div>
                    </div>
                )}

                {!loading && !error && images.length === 0 && (
                    <div className="flex justify-center">
                        <div className="glass-card p-8 rounded-3xl max-w-md text-center">
                            <p className="text-2xl font-bold text-gray-800 mb-2">Nothing to explore yet</p>
                            <p className="text-sm text-gray-500">There are no other images to recommend right now.</p>
                        </div>
                    </div>
                )}

                {images.length > 0 && <ImageMasonry images={images} badge={badge} />}

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
