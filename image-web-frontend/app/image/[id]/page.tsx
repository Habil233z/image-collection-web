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
  DialogDescription,
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

    const [commentId, setCommentId] = useState<Int32Array | null>(null)
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
            if (comment.length == 0) {
            const inputEl = document.getElementById("createCommentInput") as HTMLInputElement
            inputEl.reportValidity()
            return
            }
            await api.post(`http://localhost:8080/api/image/${id}/comments`, {comment})
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
            await api.patch(`http://localhost:8080/api/image/${imageId}/comment/${commentId}`, {editCommentText})
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


                {comments ? (
                <>
                    <div className="flex flex-col items-center justify-center max-w-[70%] bg-white rounded-lg my-4 shadow-2xl border-2 border-gray-200">
                        <h2 className="text-4xl mt-4 font-semibold">Comments</h2>
                        <div className="p-4 max-w-full flex flex-wrap justify-center gap-4">
                            {comments.map((commentItem) => (
                                <div key={commentItem.id} className="bg-gray-200 min-h-30 min-w-70 rounded-2xl border-2 border-gray-400">
                                    <div className="flex p-3 justify-between">
                                        <div className="w-20 h-20 rounded-full bg-white overflow-hidden">
                                            <img className="h-full w-full object-cover" src="test" onError={(e) => {e.currentTarget.onerror = null; e.currentTarget.src = "/user.png"}}/>
                                        </div>

                                        <div className="ml-4">
                                            <h3 className="text-2xl font-semibold">{commentItem.username}</h3>
                                            <p className="break-all max-w-90">{commentItem.comment}</p>
                                        </div>

                                        <div className="ml-4 mt-1 flex flex-col items-end gap-2">
                                            <p>{new Date(commentItem.created_at).toLocaleDateString()}</p>
                                            {username === commentItem.username && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="font-bold text-2xl cursor-pointer">
                                                        :
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuGroup>
                                                        <DropdownMenuLabel>Comment</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => {setEditCommentText(commentItem.comment), setIsDialogOpen(true), setCommentId(commentItem.id)}}className="hover:bg-linear-to-r from-blue-300 to-blue-400">Edit</DropdownMenuItem>
                                                        </DropdownMenuGroup>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuGroup>
                                                        <DropdownMenuItem onClick={() => deleteComment(commentItem.id, imageDetail.id)} className="hover:bg-linear-to-r from-red-500 to-red-700 focus:border">Delete</DropdownMenuItem>
                                                        </DropdownMenuGroup>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                            <div className="bg-white rounded-2xl p-4 min-h-20 min-w-100 flex flex-col">
                                <h2 className="my-1">Your comment</h2>
                                <input id="createCommentInput" type="text" value={comment} onChange={(e) => setComment(e.target.value)} required className="border rounded-lg px-2 my-1"/>
                                <Button onClick={createComment}>Send</Button>
                            </div>
                    </div>
                </>
                ) : (
                    <>
                        
                        <div className="bg-white rounded-2xl p-4 min-h-20 min-w-100 flex flex-col my-4 shadow-2xl">
                            <p className="text-4xl font-semibold text-center my-2">No Comments</p>
                            <h2 className="my-1">Your comment</h2>
                            <input id="createCommentInput" type="text" value={comment} onChange={(e) => setComment(e.target.value)} required className="border rounded-lg px-2 my-1" />
                            <Button onClick={createComment}>Send</Button>
                        </div>
                    </>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Comment</DialogTitle>
                        <DialogDescription className="flex flex-col gap-3 pt-3">
                            <input id="editCommentInput" type="text" className="border rounded-md px-2 py-1 text-black bg-white" placeholder="Your comment" value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} required/>
                            <Button onClick={() => editComment(imageDetail.id)}>Save Comment</Button>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    )
}