"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import api from "@/lib/api"
import { getStoredUsername } from "@/lib/auth"
import ImageCropper from "@/components/image-cropper"
import Link from "next/link"

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

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  async function getImages(pageNum: number) {
    setLoading(true)
    try {
      const response = await api.get(`images?page=${pageNum}`)
      console.log("Images API Response:", response.data) // Check F12 Console to see what comes back
      
      const fetchedImages = response.data.data || []
      setImages(fetchedImages)
      
      if (fetchedImages.length < 20) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }
      setError(false)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch images:", error)
      setError(true)
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
    try {
      const formElement = e.currentTarget
      const imageNameInput = formElement.elements.namedItem("imageName")
      const imageData = new FormData()
      imageData.append("imageFile", selectedFile)
      imageData.append("imageName", imageNameInput.value)

      setLoading(true)
      setOpen(false)
      await api.post("api/upload", imageData, {headers: {"Content-Type": undefined}})
      setFinalFile(null)
      setLoading(false)
      getImages(page)
    } catch (error: any) {
      console.error("Upload error:", error)
      alert(error.response?.data?.error || "Failed to upload image")
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedUsername = getStoredUsername()
    setUsername(storedUsername)
    setAuthChecked(true)
    getImages(page)
  }, [page]);

  return (
    <div className="min-h-screen w-screen bg-linear-to-br from-sky-100 via-sky-200 to-blue-300 flex flex-col">
      <Header username={username} />

      <main className="px-6 py-2 mx-auto w-full">

        {loading && (
          <div className="flex w-full mt-40 justify-center items-center text-4xl">
              Loading Data...
          </div>
        )}

        {!loading && (
          <>
            {images && images.length > 0 ? (
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 h-full pb-10 break-inside-avoid mb-4">
              {images.map((image) => (
                <Link key={image.id} href={`/image/${image.id}`}>
                    <div className="overflow-hidden bg-gray-100 hover:scale-105 duration-300 mb-4">
                      <img 
                        src={`${image.image_url}`} 
                        alt={image.image_name} 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="bg-white/60 backdrop-blur-md border border-white/60 p-8 rounded-3xl shadow-xl max-w-md">
                <p className="text-2xl font-bold text-gray-800 mb-2">No images found</p>
                <p className="text-sm text-gray-500">Upload your first image share it with others!</p>
              </div>
            </div>
          )}
        </>
        )}
      </main>

      {images && !loading && images.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-2 pb-4">
              <Button 
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))} 
                disabled={page === 1}
                className="bg-white/80 hover:bg-white text-gray-800 border border-white/60 rounded-full px-6 py-2 shadow-md disabled:opacity-50"
              >
                Previous Page
              </Button>
              <span className="text-gray-800 font-semibold px-4 py-2 bg-white/50 backdrop-blur-md rounded-full shadow-xs">
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
        <DialogTrigger className="fixed bottom-8 right-8 bg-black hover:bg-gray-800 text-white px-6 py-4 rounded-full shadow-2xl font-medium flex items-center gap-2 z-50">
          <span>+ Upload Image</span>
        </DialogTrigger>
        <DialogContent className={`${cropFile ? "sm:max-w-2xl" : "sm:max-w-md"} max-h-[95vh] overflow-y-auto rounded-3xl bg-white/95 backdrop-blur-md border border-white/60 p-6`}>
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
                className="w-full text-black border border-gray-200 rounded-xl text-base px-4 py-3 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 transition" 
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
          className="fixed bottom-8 right-8 bg-black hover:bg-gray-800 text-white px-6 py-4 rounded-full shadow-2xl font-medium flex items-center gap-2 z-50"
        >
          <span>Log in to upload</span>
        </Link>
      )}
    </div>
  )
}
