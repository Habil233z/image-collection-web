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
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function ImageDetail() {
    const params = useParams()
    const id = params?.id
    const router = useRouter()

    const [username, setUsername] = useState<string | null>(null)
    const [imageDetail, setImageDetail] = useState<any>(null)
    const [comment, setComment] = useState<string>("")
    const [comments, setComments] = useState<any[] | null>(null)

    const [commentId, setCommentId] = useState<any | null>(null)
    const [editCommentText, setEditCommentText] = useState<string>("")
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

    async function getImageDetail(targetId: any) {
        try {
            const response = await api.get(`http://localhost:8080/image/${targetId}`);
            setImageDetail(response.data.data);
        } catch (error) {
            console.log("Error fetching image detail:", error)
        }
    }

    async function handleDeleteImage() {
        if (!window.confirm("Are you sure you want to delete this image?")) {
            return
        }
        try {
            await api.delete(`http://localhost:8080/api/image/${id}`)
            router.push("/")
        } catch (error: any) {
            console.error("Error deleting image:", error)
            alert(error.response?.data?.error || "Failed to delete image.")
        }
    }

    async function createComment() {
        try {
            if (comment.length === 0) {
                const inputEl = document.getElementById("createCommentInput") as HTMLInputElement
                inputEl?.reportValidity()
                return
            }
            await api.post(`http://localhost:8080/api/image/${id}/comments`, { comment })
            setComment("")
            getComments(id)
        } catch (error) {
            console.log(error)
        }
    }

    async function getComments(imageId: any) {
        try {
            const response = await api.get(`http://localhost:8080/image/${imageId}/comments`)
            setComments(response.data.data)
        } catch (error) {
            console.log(error)
        }
    }

    async function editComment(imageId: any) {
        try {
            if (!editCommentText.trim()) {
                const inputEl = document.getElementById("editCommentInput") as HTMLInputElement
                inputEl?.reportValidity()
                return
            }
            await api.patch(`http://localhost:8080/api/image/${imageId}/comment/${commentId}`, { editCommentText })
            alert("Comment has been edited")
            setIsDialogOpen(false)
            getComments(id)
        } catch (error) {
            console.log(error)
        }
    }

    async function deleteComment(commentId: any, imageId: any) {
        if (!window.confirm("Are you sure you want to delete this comment?")) {
            return
        }
        try {
            await api.delete(`http://localhost:8080/api/image/${imageId}/comment/${commentId}`)
            getComments(id)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        const storedUsername = localStorage.getItem("username")
        setUsername(storedUsername)
        if (id) {
            getImageDetail(id)
            getComments(id)
        }
    }, []);

    return (
        <div className="min-h-screen w-full bg-linear-to-br from-sky-100 via-sky-200 to-blue-300 flex flex-col pb-16">
            <Header username={username} />

            <main className="flex-1 w-full px-6 sm:px-12 flex flex-col items-center">
                {imageDetail && (
                    <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl p-6 sm:p-8 w-full max-w-6xl border border-white/60 flex flex-col items-center mb-8">
                        <h2 className="text-3xl sm:text-5xl font-bold text-center text-gray-900 mb-6">{imageDetail.image_name}</h2>
                        <div className="w-full flex flex-col items-center">
                            <img 
                                src={`http://localhost:8080/${imageDetail.image_path}`} 
                                className="max-h-[600px] w-auto rounded-2xl object-contain shadow-md mb-6" 
                                alt={imageDetail.image_name}
                            />  
                                {username === imageDetail.username ? (
                                <div className="flex justify-between items-center w-full px-2 mt-2 text-gray-600 border-t border-gray-100 pt-4">
                                    <h2 className="text-base sm:text-lg font-medium text-gray-700">Created by <span className="font-semibold text-sky-600">{imageDetail.username} (You)</span></h2>
                                    <div className="flex items-center">
                                    <p className="text-xs sm:text-sm font-light text-gray-400 mr-2">Created at: {new Date(imageDetail.created_at).toLocaleDateString()}</p>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="focus:outline-none">
                                            <div className="font-bold text-lg cursor-pointer w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 transition shadow-xs">
                                                ⋮
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-36 rounded-2xl p-1 shadow-xl bg-white/95 backdrop-blur-md border border-white/80">
                                            <DropdownMenuGroup>
                                                <DropdownMenuLabel className="text-xs uppercase tracking-wider text-gray-400 px-2 py-1">Image</DropdownMenuLabel>
                                                <Link href={`/image/${imageDetail.id}/edit`}>
                                                    <DropdownMenuItem className="cursor-pointer font-medium rounded-xl px-3 py-1.5 focus:bg-sky-50 focus:text-sky-600 transition">Edit</DropdownMenuItem>
                                                </Link>
                                            </DropdownMenuGroup>
                                            <DropdownMenuSeparator className="my-1 border-gray-100" />
                                            <DropdownMenuGroup>
                                                <DropdownMenuItem onClick={handleDeleteImage} className="cursor-pointer text-red-600 font-medium rounded-xl px-3 py-1.5 focus:bg-red-50 focus:text-red-700 transition">Delete</DropdownMenuItem>
                                            </DropdownMenuGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    </div>
                                </div>
                                ) : (
                                    <div className="flex justify-between items-center w-full px-2 mt-2 text-gray-600 border-t border-gray-100 pt-4">
                                        <h2 className="text-base sm:text-lg font-medium text-gray-700">Created by <span className="font-semibold text-sky-600">{imageDetail.username}</span></h2>
                                        <p className="text-xs sm:text-sm font-light text-gray-400">Created at: {new Date(imageDetail.created_at).toLocaleDateString()}</p>
                                    </div>
                                )}
                        </div>
                    </div>
                )}

                <div className="w-full max-w-full bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60 p-6 sm:p-8 flex flex-col">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">Comments</h2>

                    {comments && comments.length > 0 ? (
                        <div className="flex flex-wrap gap-4 w-full mb-6">
                            {comments.map((commentItem) => (
                                <div key={commentItem.id} className="bg-white/80 backdrop-blur-xs rounded-2xl border border-white/80 p-4 sm:p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-white overflow-hidden border border-gray-200 shrink-0 shadow-inner">
                                                <img className="h-full w-full object-cover" src="test" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/user.png" }} alt="User Avatar" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-900">{commentItem.username}</h3>
                                                <p className="text-gray-600 break-all mt-1 text-sm sm:text-base">{commentItem.comment}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            {username === commentItem.username && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="focus:outline-none">
                                                        <div className="font-bold text-base cursor-pointer w-7 h-7 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 transition shadow-xs">
                                                            ⋮
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-32 rounded-2xl p-1 shadow-xl bg-white/95 backdrop-blur-md border border-white/80">
                                                        <DropdownMenuGroup>
                                                            <DropdownMenuItem 
                                                                onClick={() => { 
                                                                    setEditCommentText(commentItem.comment); 
                                                                    setIsDialogOpen(true); 
                                                                    setCommentId(commentItem.id); 
                                                                }} 
                                                                className="cursor-pointer font-medium rounded-xl px-3 py-1.5 focus:bg-sky-50 focus:text-sky-600 transition"
                                                            >
                                                                Edit
                                                            </DropdownMenuItem>
                                                        </DropdownMenuGroup>
                                                        <DropdownMenuSeparator className="my-1 border-gray-100" />
                                                        <DropdownMenuGroup>
                                                            <DropdownMenuItem 
                                                                onClick={() => deleteComment(commentItem.id, imageDetail.id)} 
                                                                className="cursor-pointer text-red-600 font-medium rounded-xl px-3 py-1.5 focus:bg-red-50 focus:text-red-700 transition"
                                                            >
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuGroup>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                                        <p className="text-xs text-gray-400">{new Date(commentItem.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-lg font-medium text-gray-400 text-center py-6">No Comments yet. Be the first to comment!</p>
                    )}

                    <div className="bg-white/80 rounded-2xl p-4 border border-white/80 flex flex-col gap-3 mt-auto shadow-inner">
                        <label className="text-sm font-semibold uppercase tracking-wider text-gray-600">Your comment</label>
                        <input 
                            id="createCommentInput" 
                            type="text" 
                            value={comment} 
                            onChange={(e) => setComment(e.target.value)} 
                            placeholder="Write your comment here..." 
                            required 
                            className="w-full text-black border border-gray-200 rounded-xl text-sm sm:text-base px-4 py-3 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
                        />
                        <Button onClick={createComment} className="w-full sm:w-auto self-end bg-neutral-900 hover:bg-black text-white font-medium px-6 py-2.5 rounded-full transition shadow-lg text-sm sm:text-base mt-2">
                            Send
                        </Button>
                    </div>
                </div>
            </main>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl bg-white/95 backdrop-blur-md border border-white/60 p-6">
                    <DialogHeader className="space-y-4">
                        <DialogTitle className="text-center text-2xl font-bold text-gray-900">Edit Comment</DialogTitle>
                        <div className="flex flex-col gap-4 pt-2">
                            <input 
                                id="editCommentInput" 
                                type="text" 
                                className="w-full text-black border border-gray-200 rounded-xl text-sm sm:text-base px-4 py-3 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 transition" 
                                placeholder="Update your comment..." 
                                value={editCommentText} 
                                onChange={(e) => setEditCommentText(e.target.value)} 
                                required
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-full px-5 py-2.5 border-gray-300">Cancel</Button>
                                <Button onClick={() => editComment(imageDetail.id)} className="bg-neutral-900 hover:bg-black text-white rounded-full px-6 py-2.5 shadow-lg">Save Comment</Button>
                            </div>
                        </div>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    )
}