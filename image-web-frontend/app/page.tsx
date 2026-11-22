"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import api from "@/lib/api"
import { getStoredUsername } from "@/lib/auth"
import ImageCropper from "@/components/image-cropper"
import Link from "next/link"

// Heights (as width/height ratios) for the placeholder tiles shown while the first page loads
const SKELETON_RATIOS = [1.2, 0.75, 1, 1.45, 0.9, 1.1, 0.7, 1.3, 1, 0.85, 1.25, 0.8, 1.15, 0.95, 1.35]

type PendingUpload = { id: number; url: string; title: string }

export default function Home() {
  const [username, setUsername] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState<boolean>(false)
  const [images, setImages] = useState<any[] | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  // file currently being cropped/resized (null = cropper closed)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropUrl, setCropUrl] = useState<string | null>(null)
  const [open, setOpen] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)

  // uploads that are still in flight: shown as "ghost" tiles at the top of the grid
  const [pending, setPending] = useState<PendingUpload[]>([])

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  // silent = refresh the grid in place without swapping it for the loading skeleton
  async function getImages(pageNum: number, silent = false) {
    if (!silent) setLoading(true)
    try {
      const response = await api.get(`images?page=${pageNum}`)
      const fetchedImages = response.data.data || []
      setImages(fetchedImages)
      setHasMore(fetchedImages.length >= 20)
      setError(false)
    } catch (error) {
      console.error("Failed to fetch images:", error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  function setFinalFile(file: File | null) {
    setSelectedFile(file)
    setPreviewImage((old) => {
      if (old) URL.revokeObjectURL(old)
      return file ? URL.createObjectURL(file) : null
    })
  }

  function openCropper(file: File) {
    setCropFile(file)
    setCropUrl(URL.createObjectURL(file))
  }

  function closeCropper() {
    if (cropUrl) URL.revokeObjectURL(cropUrl)
    setCropFile(null)
    setCropUrl(null)
  }

  function handleImageChange(e: any) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-picking the same file
    if (file) {
      openCropper(file) // let the user crop / resize before it is used
    }
  }

  function handleDialogChange(next: boolean) {
    setOpen(next)
    if (!next) {
      closeCropper()
      setFinalFile(null)
    }
  }

  async function handleUploadImage(e: any) {
    e.preventDefault()
    if (!selectedFile) {
      alert("Please select an image file")
      return
    }

    const formElement = e.currentTarget
    const title: string = formElement.elements.namedItem("imageName").value
    const imageData = new FormData()
    imageData.append("imageFile", selectedFile)
    imageData.append("imageName", title)

    // Optimistic UI: show a ghost tile immediately, with its own preview URL
    // (the dialog's preview URL is revoked when the dialog resets).
    const ghost: PendingUpload = { id: Date.now(), url: URL.createObjectURL(selectedFile), title }
    setPending((prev) => [ghost, ...prev])
    setOpen(false)
    closeCropper()
    setFinalFile(null)

    try {
      await api.post("api/upload", imageData, { headers: { "Content-Type": undefined } })
      // the newest image is on page 1
      if (page !== 1) {
        setPage(1) // the page effect reloads the grid
      } else {
        await getImages(1, true)
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      alert(error.response?.data?.error || "Failed to upload image")
    } finally {
      setPending((prev) => prev.filter((p) => p.id !== ghost.id))
      URL.revokeObjectURL(ghost.url)
    }
  }

  useEffect(() => {
    const storedUsername = getStoredUsername()
    setUsername(storedUsername)
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    getImages(page)
  }, [page]);

  const hasContent = (images && images.length > 0) || pending.length > 0

  return (
    <div className="page-bg min-h-screen w-full flex flex-col">
      <Header username={username} />

      <main className="px-4 sm:px-8 pb-6 mx-auto w-full max-w-400">

        <section className="text-center mb-8 mt-2">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
            Discover <span className="bg-linear-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">images</span>
          </h2>
        </section>

        {loading && (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4" aria-busy="true" aria-label="Loading images">
            {SKELETON_RATIOS.map((ratio, i) => (
              <div
                key={i}
                className="skeleton rounded-2xl mb-4 break-inside-avoid"
                style={{ aspectRatio: `1 / ${ratio}`, animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="glass-card p-8 rounded-3xl max-w-md">
              <p className="text-2xl font-bold text-gray-800 mb-2">Couldn&apos;t load images</p>
              <p className="text-sm text-gray-500 mb-4">Something went wrong while contacting the server.</p>
              <Button onClick={() => getImages(page)} className="bg-neutral-900 hover:bg-black text-white rounded-full px-6">
                Try again
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {hasContent ? (
              // Masonry: each image keeps its natural aspect ratio, columns fill unevenly
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 pb-10">
                {/* Ghost tiles for uploads that are still being sent */}
                {pending.map((p) => (
                  <div
                    key={p.id}
                    className="relative mb-4 break-inside-avoid overflow-hidden rounded-2xl shadow-lg ring-2 ring-sky-400/70 bg-white/60"
                    aria-busy="true"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.title} className="block w-full h-auto opacity-60 blur-[2px] scale-105" />
                    <div className="shimmer absolute inset-0" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-linear-to-t from-black/70 to-transparent px-3 pt-8 pb-2.5 text-white text-sm">
                      <span className="h-4 w-4 shrink-0 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span className="truncate">Uploading “{p.title}”…</span>
                    </div>
                  </div>
                ))}

                {images?.map((image, i) => (
                  <Link
                    key={image.id}
                    href={`/image/${image.id}`}
                    className="tile-in group relative block mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-white/50 shadow-md hover:shadow-2xl hover:shadow-sky-900/25 hover:-translate-y-1 transition duration-300"
                    style={{ animationDelay: `${Math.min(i, 20) * 35}ms` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.image_url}
                      alt={image.title}
                      loading="lazy"
                      className="block w-full h-auto transition duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-sky-950/75 via-sky-950/30 to-transparent px-3 pt-10 pb-2.5 opacity-0 group-hover:opacity-100 transition duration-300">
                      <p className="text-white text-sm font-semibold truncate">{image.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="glass-card p-8 rounded-3xl max-w-md">
                  <p className="text-2xl font-bold text-gray-800 mb-2">No images found</p>
                  <p className="text-sm text-gray-500">Upload your first image and share it with others!</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {images && !loading && images.length > 0 && (
        <div className="flex justify-center items-center gap-4 mt-2 pb-24">
          <Button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="bg-white/80 hover:bg-white text-gray-800 border border-white/60 rounded-full px-6 py-2 shadow-md disabled:opacity-50"
          >
            Previous Page
          </Button>
          <span className="text-gray-800 font-semibold px-4 py-2 bg-white/60 backdrop-blur-md rounded-full shadow-xs">
            Page {page}
          </span>
          <Button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!hasMore}
            className="bg-neutral-900 hover:bg-black text-white rounded-full px-6 py-2 shadow-md disabled:opacity-50"
          >
            Next Page
          </Button>
        </div>
      )}

      {username ? (
        <Dialog open={open} onOpenChange={handleDialogChange}>
          <DialogTrigger className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-linear-to-r from-neutral-900 to-neutral-700 hover:from-black hover:to-neutral-800 hover:scale-105 active:scale-95 text-white pl-5 pr-6 py-4 rounded-full shadow-2xl shadow-sky-900/30 font-semibold flex items-center gap-2 z-50 transition duration-200">
            <span className="text-xl leading-none">+</span>
            <span>Upload Image</span>
          </DialogTrigger>
          <DialogContent className={`${cropFile ? "sm:max-w-2xl" : "sm:max-w-md"} max-h-[95vh] overflow-y-auto rounded-3xl glass-card p-6`}>
            <DialogHeader className="space-y-4">
              <DialogTitle className="text-center text-2xl font-bold text-gray-900">
                {cropFile ? "Crop & resize" : "Upload your image"}
              </DialogTitle>

              {cropFile && cropUrl ? (
                <ImageCropper
                  src={cropUrl}
                  fileName={cropFile.name}
                  mimeType={cropFile.type}
                  applyLabel="Use this crop"
                  onApply={(file) => {
                    setFinalFile(file)
                    closeCropper()
                  }}
                  onSkip={() => {
                    setFinalFile(cropFile)
                    closeCropper()
                  }}
                  onCancel={closeCropper}
                />
              ) : (
                <form onSubmit={handleUploadImage} className="flex flex-col items-center justify-center gap-4">
                  {previewImage ? (
                    <div className="flex flex-col items-center gap-2 mb-2">
                      <div className="relative w-48 h-48 border border-gray-200 rounded-2xl overflow-hidden shadow-inner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewImage} alt="Image preview" className="object-contain bg-gray-100 w-full h-full" />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" className="rounded-full px-4 text-gray-700" onClick={() => selectedFile && openCropper(selectedFile)}>
                          Crop / Resize
                        </Button>
                        <label className="inline-flex items-center cursor-pointer rounded-full border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
                          Change image
                          <input type="file" name="imageFile" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-40 mb-2 border-2 border-dashed border-sky-300 rounded-2xl bg-sky-50/50 hover:bg-sky-50 flex items-center justify-center transition cursor-pointer">
                      <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                        <span className="text-sm font-semibold text-sky-600">Select image</span>
                        <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP or GIF — you can crop &amp; resize next</span>
                        <input type="file" name="imageFile" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    </div>
                  )}

                  <input
                    type="text"
                    name="imageName"
                    placeholder="Image title"
                    className="field text-base"
                    required
                  />

                  <Button type="submit" className="w-full bg-neutral-900 hover:bg-black text-white font-medium py-3 rounded-full transition shadow-lg text-base mt-2">
                    Upload image
                  </Button>
                </form>
              )}
            </DialogHeader>
          </DialogContent>
        </Dialog>
      ) : authChecked && (
        <Link
          href="/login?redirect=%2F"
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-neutral-900 hover:bg-black text-white px-6 py-4 rounded-full shadow-2xl font-semibold flex items-center gap-2 z-50 transition hover:scale-105"
        >
          <span>Log in to upload</span>
        </Link>
      )}
    </div>
  )
}
