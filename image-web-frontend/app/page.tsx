"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import api from "@/lib/api"
import Link from "next/link"

export default function Home() {
  const [username, setUsername] = useState<string | null>(null)
  const [images, setImages] = useState<any[] | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [open, setOpen] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)

  async function getImages(pageNum: number) {
    try {
      const response = await api.get(`http://localhost:8080/images?page=${pageNum}`)
      setImages(response.data.data)
      if (response.data.data.length < 20) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }
    } catch (error) {
      console.log(error)
    }
  }

  function handleImageChange(e: any) {
    const file = e.target.files?.[0]
    if (file) {
      const image = URL.createObjectURL(file)
      setPreviewImage(image)
    } else {
      setPreviewImage(null)
    }
  }

  async function handleUploadImage(e: any) {
    e.preventDefault()
    try {
      const imageData = new FormData(e.currentTarget)
      await api.post("http://localhost:8080/api/upload", imageData)
      alert("Image upload successful")
      setOpen(false)
      setImages(null)
      setPreviewImage(null)
      getImages(page)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    const storedUsername = localStorage.getItem("username")
    setUsername(storedUsername)
    getImages(page)
  }, [page]);

  return (
    <div className="min-h-screen w-screen bg-linear-to-br from-sky-100 via-sky-200 to-blue-300 flex flex-col">
      <Header username={username} />

      <main className="px-6 py-2 mx-auto w-full">
        {images && images.length > 0 ? (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 h-full pb-10">
            {images.map((image) => (
              <Link key={image.id} href={`/image/${image.id}`} className="overflow-hidden shadow-lg mx-1">
                  <div className="overflow-hidden bg-gray-100 hover:scale-105 duration-300">
                    <img 
                      src={`http://localhost:8080/${image.image_path}`} 
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
      </main>

      {images && images.length > 0 && (
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="fixed bottom-8 right-8 bg-black hover:bg-gray-800 text-white px-6 py-4 rounded-full shadow-2xl font-medium flex items-center gap-2 z-50">
          <span>+ Upload Image</span>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md rounded-3xl bg-white/95 backdrop-blur-md border border-white/60 p-6">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-center text-2xl font-bold text-gray-900">Upload your image</DialogTitle>
            <form onSubmit={handleUploadImage} className="flex flex-col items-center justify-center gap-4">
              {previewImage ? (
                <div className="relative w-48 h-48 mb-2 border border-gray-200 rounded-2xl overflow-hidden shadow-inner group cursor-pointer">
                  <label className="cursor-pointer w-full h-full block">
                    <img src={previewImage} alt="Image preview" className="object-cover w-full h-full" />
                    <input type="file" name="imageFile" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
              ) : (
                <div className="relative w-full h-40 mb-2 border-2 border-dashed border-sky-300 rounded-2xl bg-sky-50/50 hover:bg-sky-50 flex items-center justify-center transition cursor-pointer">
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                    <span className="text-sm font-semibold text-sky-600">Select image</span>
                    <span className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF</span>
                    <input type="file" name="imageFile" accept="image/*" className="hidden" onChange={handleImageChange} required />
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
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}