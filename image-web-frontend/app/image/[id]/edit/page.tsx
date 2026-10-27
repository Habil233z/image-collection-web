"use client"

import Header from "@/components/header"
import api from "@/lib/api"
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
    const [currentImagePath, setCurrentImagePath] = useState<string>("")
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    async function getImageDetail(targetId: any) {
        try {
            const response = await api.get(`http://localhost:8080/image/${targetId}`)
            const data = response.data.data
            
            setImageName(data.image_name)
            setCurrentImagePath(data.image_path)
            
            const storedUser = localStorage.getItem("username")
            if (storedUser !== data.username) {
                router.push(`/image/${targetId}`)
            }
        } catch (error) {
            console.log("Error fetching image detail:", error)
        }
    }

    const handleImageChange = (e: any) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImageFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const formData = new FormData()
        formData.append("image_name", imageName)
        if (imageFile) {
            formData.append("imageFile", imageFile)
        }
        try {
            await api.patch(`http://localhost:8080/api/image/${id}`, formData)
            router.push(`/image/${id}`)
        } catch (err: any) {
            console.error("Error updating image:", err)
        }
    };

    useEffect(() => {
        const storedUsername = localStorage.getItem("username")
        setUsername(storedUsername)
        if (id) {
            getImageDetail(id)
        }
    }, []);

    return (
        <div className="min-h-screen w-screen bg-linear-to-br from-sky-100 via-sky-200 to-blue-300 flex flex-col pb-12">
            <Header username={username} />

            <main className="flex-1 w-full max-w-xl mx-auto px-4 flex flex-col items-center justify-center">
                <Card className="w-full shadow-2xl rounded-3xl border border-white/60 bg-white/90 backdrop-blur-md p-6 sm:p-8">
                    <CardHeader className="space-y-2 pb-6 text-center">
                        <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Edit Image</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Image Name</label>
                                <input 
                                    type="text" 
                                    value={imageName} 
                                    onChange={(e) => setImageName(e.target.value)} 
                                    className="w-full text-black border border-gray-200 rounded-xl text-base px-4 py-3 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 transition" 
                                    required
                                />
                            </div>

                            <div className="flex flex-col w-full justify-center items-center space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 self-start">Image (Click to change)</label>
                                <label className="cursor-pointer w-full flex flex-col items-center justify-center border-2 border-dashed border-sky-300 rounded-2xl bg-sky-50/50 hover:bg-sky-50 p-4 transition group">
                                    <img 
                                        src={previewUrl || `http://localhost:8080/${currentImagePath}`} 
                                        className="max-h-72 w-auto object-contain rounded-xl shadow-xs group-hover:scale-[1.02] transition" 
                                        alt="Preview"
                                    />
                                    <span className="text-xs text-sky-600 font-semibold mt-3">Click image to replace</span>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
                                </label>
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
                                    className="flex-1 bg-neutral-900 hover:bg-black text-white font-medium py-3 rounded-full transition shadow-lg text-base"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}