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
      // a 401 is handled globally (redirect to /login); anything else shows the error state
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
    <div className="min-h-screen w-screen bg-linear-to-br from-sky-100 via-sky-200 to-blue-300 flex flex-col">
      <Header username={username} />

      <main className="px-6 py-2 mx-auto w-full">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-6">Liked Images</h2>

        {loading && (
          <div className="flex w-full mt-40 justify-center items-center text-4xl">Loading Data...</div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="bg-white/60 backdrop-blur-md border border-white/60 p-8 rounded-3xl shadow-xl max-w-md">
              <p className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</p>
              <p className="text-sm text-gray-500">We couldn&apos;t load your liked images. Please try again.</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          images.length > 0 ? (
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 h-full pb-10 break-inside-avoid mb-4">
              {images.map((image) => (
                <Link key={image.id} href={`/image/${image.id}`}>
                  <div className="overflow-hidden bg-gray-100 hover:scale-105 duration-300 mb-4">
                    <img src={image.image_url} alt={image.title} className="w-full h-auto object-cover" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <div className="bg-white/60 backdrop-blur-md border border-white/60 p-8 rounded-3xl shadow-xl max-w-md">
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
