"use client"

import Header from "@/components/header"
import api from "@/lib/api"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"

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
        <>
            <Header username={username} />

            <div className="h-full w-full px-4 py-8 flex flex-col items-center justify-center">

                <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-xl">
                    <h1 className="text-3xl font-bold text-center mb-6">Edit Image</h1>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-2xl font-semibold text-gray-700">Image Name</h2>
                            <input type="text" value={imageName} onChange={(e) => setImageName(e.target.value)} className="border border-gray-300 rounded-lg px-2 text-3xl focus:ring-blue-500" required/>
                        </div>

                        <div className="flex  flex-col w-full justify-center items-center">
                            <h2 className="text-2xl font-semibold text-gray-700">Image</h2>
                            <label className="cursor-pointer">
                                <img src={previewUrl || `http://localhost:8080/${currentImagePath}`} className="max-h-80 w-auto object-contain"/>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
                            </label>
                        </div>

                        <div className="flex gap-4 mt-4">
                            <button type="submit" className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700">Save</button>
                            <button type="button" onClick={() => router.push(`/image/${id}`)} className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}