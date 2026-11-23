"use client"

import Header from "@/components/header"
import ImageCropper from "@/components/image-cropper"
import TagInput from "@/components/tag-input"
import api from "@/lib/api"
import { getStoredUsername, loginUrl } from "@/lib/auth"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EditImage() {
    const router = useRouter()
    const params = useParams()
    const id = params?.id

    const [username, setUsername] = useState<string | null>(null)
    const [imageName, setImageName] = useState<string>("")
    const [tags, setTags] = useState<string[]>([])
    const [currentImagePath, setCurrentImagePath] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const [cropSource, setCropSource] = useState<{ url: string; name: string; type: string } | null>(null)
    const [loadingCrop, setLoadingCrop] = useState<boolean>(false)
    const [saving, setSaving] = useState<boolean>(false)

    async function getImageDetail(targetId: any) {
        try {
            const response = await api.get(`image/${targetId}`)
            const data = response.data.data
            
            setImageName(data.title)
            setTags(data.tags || [])
            setCurrentImagePath(data.image_url)
            
            const storedUser = getStoredUsername()
            if (storedUser !== data.username) {
                router.push(`/image/${targetId}`)
            }
        } catch (error) {
            console.log("Error fetching image detail:", error)
        }
    }

    function closeCropper() {
        if (cropSource) URL.revokeObjectURL(cropSource.url)
        setCropSource(null)
    }

    const handleImageChange = (e: any) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            e.target.value = ""
            setCropSource({ url: URL.createObjectURL(file), name: file.name, type: file.type })
        }
    };

    async function cropCurrentImage() {
        if (!currentImagePath) return
        setLoadingCrop(true)
        try {
            const res = await fetch(currentImagePath, { mode: "cors" })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const blob = await res.blob()
            const fileName = currentImagePath.split("/").pop()?.split("?")[0] || "image"
            setCropSource({ url: URL.createObjectURL(blob), name: fileName, type: blob.type })
        } catch (err) {
            console.error("Could not load current image for editing:", err)
            alert("Could not load the current image for editing. Try picking the image file again instead.")
        } finally {
            setLoadingCrop(false)
        }
    }

    function handleCropApplied(file: File) {
        setImageFile(file)
        setPreviewUrl((old) => {
            if (old) URL.revokeObjectURL(old)
            return URL.createObjectURL(file)
        })
        closeCropper()
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const formData = new FormData()
        formData.append("title", imageName)
        formData.append("tags", tags.join(","))
        if (imageFile) {
            formData.append("imageFile", imageFile)
        }
        try {
            setSaving(true)
            await api.patch(`api/image/${id}`, formData, {headers: {"Content-Type": undefined}})

            router.push(`/image/${id}`)
        } catch (err: any) {
            console.error("Error updating image:", err)
            alert(err.response?.data?.error || "Failed to update image")
            setSaving(false)
        }
    };

    useEffect(() => {
        const storedUsername = getStoredUsername()
        setUsername(storedUsername)
        if (!storedUsername) {
            router.replace(loginUrl(`/image/${id}/edit`))
            return
        }
        if (id) {
            getImageDetail(id)
        }
    }, [id]);

    return (
        <div className="page-bg min-h-screen w-full flex flex-col pb-12">
            <Header username={username} />

            <main className="flex-1 w-full max-w-xl mx-auto px-4 flex flex-col items-center justify-center">
                <Card className="w-full glass-card rounded-3xl tile-in p-6 sm:p-8">
                    <CardHeader className="space-y-2 pb-6 text-center">
                        <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                            {cropSource ? "Crop & Resize" : "Edit Image"}
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        {cropSource ? (
                            <ImageCropper
                                src={cropSource.url}
                                fileName={cropSource.name}
                                mimeType={cropSource.type}
                                applyLabel="Use this crop"
                                onApply={handleCropApplied}
                                onCancel={closeCropper}
                            />
                        ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Image Name</label>
                                <input 
                                    type="text" 
                                    value={imageName} 
                                    onChange={(e) => setImageName(e.target.value)} 
                                    className="field text-base" 
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Tags</label>
                                <TagInput tags={tags} onChange={setTags} />
                            </div>

                            <div className="flex flex-col w-full justify-center items-center space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 self-start">Image</label>
                                <div className="w-full flex flex-col items-center justify-center border-2 border-dashed border-sky-300 rounded-2xl bg-sky-50/50 p-4">
                                    <div className="relative rounded-xl overflow-hidden shadow-md">
                                        <img 
                                            src={previewUrl || currentImagePath || "test"} 
                                            className={`block max-h-72 w-auto max-w-full object-contain transition ${saving ? "opacity-60 blur-[1px]" : ""}`} 
                                            alt="Preview"
                                        />
                                        {saving && (
                                            <>
                                                <div className="shimmer absolute inset-0" />
                                                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/50 py-2 text-sm text-white">
                                                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                                    Saving...
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {imageFile && (
                                        <span className="text-xs text-emerald-600 font-semibold mt-3">New image ready — it will replace the current one when you save</span>
                                    )}
                                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={loadingCrop}
                                            onClick={() => {
                                                if (imageFile && previewUrl) {
                                                    setCropSource({ url: URL.createObjectURL(imageFile), name: imageFile.name, type: imageFile.type })
                                                } else {
                                                    cropCurrentImage()
                                                }
                                            }}
                                            className="rounded-full px-4 text-gray-700"
                                        >
                                            {loadingCrop ? "Loading..." : "Crop / Resize"}
                                        </Button>
                                        <label className="inline-flex items-center cursor-pointer rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
                                            Replace image
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-2">
                                <Button 
                                    type="button" 
                                    onClick={() => router.push(`/image/${id}`)} 
                                    variant="outline"
                                    className="flex-1 py-3 rounded-full border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={saving}
                                    className="flex-1 bg-neutral-900 hover:bg-black text-white font-medium py-3 rounded-full transition shadow-lg text-base disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
