"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Header from "@/components/header"
import api from "@/lib/api"
import { getStoredUsername, loginUrl } from "@/lib/auth"

export default function LikedImages() {
  const [username, setUsername] = useState<string | null>(null)
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  async function getLikedImages() {
    setLoading(true)
    try {
      const response = await api.get("api/liked-images")
      setImages(response.data.data || [])
      setError(false)
    } catch (err) {
      console.error("Failed to fetch liked images:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedUsername = getStoredUsername()
    setUsername(storedUsername)
    if (!storedUsername) {
      window.location.href = loginUrl("/liked")
      return
    }
    getLikedImages()
  }, [])

  return (
    <div className="page-bg min-h-screen w-full flex flex-col">
      <Header username={username} />

      <main className="px-4 sm:px-8 pb-6 mx-auto w-full max-w-400">
        <section className="text-center mb-8 mt-2">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
            Liked <span className="bg-linear-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">images</span>
          </h2>
        </section>

        {loading && (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4" aria-busy="true">
            {[1.2, 0.8, 1, 1.4, 0.9, 1.1, 0.75, 1.3, 1, 0.85].map((ratio, i) => (
              <div key={i} className="skeleton rounded-2xl mb-4 break-inside-avoid" style={{ aspectRatio: `1 / ${ratio}` }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="glass-card p-8 rounded-3xl max-w-md">
              <p className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</p>
              <p className="text-sm text-gray-500">We couldn&apos;t load your liked images. Please try again.</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          images.length > 0 ? (
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 pb-10">
              {images.map((image, i) => (
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
          ) : (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <div className="glass-card p-8 rounded-3xl max-w-md">
                <p className="text-2xl font-bold text-gray-800 mb-2">No liked images yet</p>
                <p className="text-sm text-gray-500 mb-4">Tap the heart on an image to save it here.</p>
                <Link href="/" className="inline-block bg-neutral-900 hover:bg-black text-white font-medium px-6 py-2.5 rounded-full shadow-md transition">
                  Browse images
                </Link>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  )
}
