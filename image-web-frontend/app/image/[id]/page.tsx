"use client";

import Header from "@/components/header";
import api from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation";

export default function ImageDetail() {
    const params = useParams()
    const id = params?.id
    const router = useRouter()

    const [username, setUsername] = useState<string | null>(null);
    const [imageDetail, setImageDetail] = useState<any>(null);

    async function getImageDetail(targetId: any) {
        try {
            const response = await api.get(`http://localhost:8080/image/${targetId}`);
            setImageDetail(response.data.data);
            console.log("Fetched image data:", response.data.data)
        } catch (error) {
            console.log("Error fetching image detail:", error)
        }
    }

    async function handleDeleteImage() {
        if (!window.confirm("Are you sure you want to delete this image?")) {
            return;
        }
        try {
            await api.delete(`http://localhost:8080/api/image/${id}`)
            router.push("/"); 
        } catch (error: any) {
            console.error("Error deleting image:", error)
            alert(error.response?.data?.error || "Failed to delete image.")
        }
    }

    useEffect(() => {
        const storedUsername = localStorage.getItem("username")
        setUsername(storedUsername);
        if (id) {
            getImageDetail(id);
        }
    }, []);

    return (
        <>
            <Header username={username} />

            <div className="h-full w-full px-4 flex flex-col items-center justify-center">
                {imageDetail && (
                    <div className="bg-white shadow-2xl rounded-2xl p-4">

                        <h2 className="text-6xl font-bold text-center">{imageDetail.image_name}</h2>
                        <div>
                            <img src={`http://localhost:8080/${imageDetail.image_path}`} className="max-h-150 w-auto object-cover"></img>
                            <h2>Created at:{new Date(imageDetail.created_at).toLocaleDateString()}</h2>
                            <div className="flex justify-between w-full">
                                <h2 className="text-2xl">Created by {imageDetail.username}</h2>
                                    {username === imageDetail.username && (
                                    <>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger>
                                            <div className="font-bold text-2xl cursor-pointer w-5 rounded-4xl border-2">:</div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuGroup>
                                            <DropdownMenuLabel>Image</DropdownMenuLabel>
                                            <Link href={`/image/${imageDetail.id}/edit`}><DropdownMenuItem className="focus:bg-linear-to-r from-blue-300 to-blue-400">Edit</DropdownMenuItem></Link>
                                            </DropdownMenuGroup>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuGroup>
                                            <DropdownMenuItem onClick={handleDeleteImage} className="focus:bg-linear-to-r from-red-400 to-red-500 focus:border">Delete</DropdownMenuItem>
                                            </DropdownMenuGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    </>
                        )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}