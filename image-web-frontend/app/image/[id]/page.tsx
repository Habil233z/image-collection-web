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
import Comments from "@/components/comments";
import { getStoredAvatar, getStoredUsername, loginUrl } from "@/lib/auth";
import { downloadImage } from "@/lib/download";
import { usePageTitle } from "@/lib/usePageTitle";

export default function ImageDetail() {
    const params = useParams()
    const id = params?.id as string
    const router = useRouter()

    const [username, setUsername] = useState<string | null>(null)
    const [imageDetail, setImageDetail] = useState<any>(null)
    const [likesCount, setLikesCount] = useState<number>(0)
    const [liked, setLiked] = useState<boolean>(false)
    const [comment, setComment] = useState<string>("")
    const [comments, setComments] = useState<any[]>([])

    const [downloading, setDownloading] = useState<boolean>(false)

    usePageTitle(imageDetail?.title)

    const [page, setPage] = useState<number>(1)
    const [hasMore, setHasMore] = useState<boolean>(true)

    async function getImageDetail() {
        try {
            const response = await api.get(`image/${id}`);
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
            await api.delete(`api/image/${id}`)
            router.push("/")
        } catch (error: any) {
            console.error("Error deleting image:", error)
            alert(error.response?.data?.error || "Failed to delete image.")
        }
    }

    async function handleDownload() {
        if (!imageDetail || downloading) return
        setDownloading(true)
        try {
            await downloadImage(imageDetail.image_url, imageDetail.title)
        } finally {
            setDownloading(false)
        }
    }

    async function getLikes() {
        try {
            const response = await api.get(`image/${id}/likes`)
            if (response.data.isLiked) {
                setLiked(true)
            }
            setLikesCount(response.data.likeCount)
        } catch (error) {
            console.log(error)
        }
    }

    async function handleLike() {
        if (!username) {
            router.push(loginUrl(`/image/${id}`))
            return
        }
        const previousLiked = liked
        const previousLikesCount = likesCount

        const newLikedState = !liked
        const newLikesCount = newLikedState ? likesCount + 1 : Math.max(0, likesCount - 1)

        setLiked(newLikedState)
        setLikesCount(newLikesCount)

        try {
            await api.post(`api/image/${id}/like`)
        } catch (error) {
            console.log("Failed to like image:", error)
            setLiked(previousLiked)
            setLikesCount(previousLikesCount)
        }
    }

    async function createComment() {
        if (!username) {
            router.push(loginUrl(`/image/${id}`))
            return
        }
        if (comment.trim().length === 0) {
            const inputEl = document.getElementById("createCommentInput") as HTMLInputElement
            inputEl?.reportValidity()
            return
        }

        const previousComments = [...comments]

        const tempCommentId = Date.now()
        const optimisticComment = {
            id: tempCommentId,
            comment: comment,
            username: username || "You",
            avatar_url: getStoredAvatar() || "",
            created_at: new Date().toISOString(),
            pending: true,
        }

        setComments((prev) => [optimisticComment, ...prev])
        const commentToSend = comment
        setComment("")

        try {
            await api.post(`api/image/${id}/comments`, { comment: commentToSend })
            
            getComments(page)
        } catch (error) {
            console.error("Failed to create comment:", error)
            alert("Failed to post comment.")

            setComments(previousComments)
            setComment(commentToSend)
        }
    }

    async function getComments(pageNum: number) {
        try {
            const response = await api.get(`image/${id}/comments?page=${pageNum}`)
            if (response.data.data === null) {
                setComments([])
                return
            }
            setComments(response.data.data)
            if (response.data.data.length < 8) {
                setHasMore(false)
            } else {
                setHasMore(true)
            }
        } catch (error) {
            console.log(error)
        }
    }
    
    useEffect(() => {
        const storedUsername = getStoredUsername()
        setUsername(storedUsername)
        if (id) {
            getImageDetail()
            getComments(page)
            getLikes()
        }
    }, [page, id]);

    return (
        <div className="page-bg min-h-screen w-full flex flex-col pb-16">
            <Header username={username} />

            <main className="flex-1 w-full px-6 sm:px-12 flex flex-col items-center">
                {imageDetail && (
                    <div className="glass-card tile-in rounded-3xl p-5 sm:p-8 w-full max-w-6xl flex flex-col items-center mb-8">
                        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-center text-gray-900 mb-6">{imageDetail.title}</h2>
                        <div className="w-full flex flex-col items-center">
                            <img 
                                src={`${imageDetail.image_url}`} 
                                className="max-h-150 max-w-full w-auto h-auto rounded-2xl object-contain shadow-xl shadow-sky-900/20 mb-6" 
                                alt={imageDetail.title}
                            />

                            <div className="flex flex-wrap justify-between items-center gap-4 w-full px-1 text-gray-600 border-t border-gray-200/70 pt-4">
                                <div className="flex items-center gap-3">
                                    <Link href={username === imageDetail.username ? "/profile" : `/user/${imageDetail.user_id}`} className="shrink-0">
                                    <img
                                        src={imageDetail.avatar_url || "/user.png"}
                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/user.png"; }}
                                        alt={imageDetail.username}
                                        className="h-11 w-11 rounded-full object-cover bg-white ring-2 ring-white shadow-md"
                                    />
                                    </Link>
                                    <div className="leading-tight">
                                        <p className="text-base sm:text-lg font-medium text-gray-700">
                                            Created by <Link href={username === imageDetail.username ? "/profile" : `/user/${imageDetail.user_id}`} className="font-semibold text-sky-600 hover:underline">{imageDetail.username}{username === imageDetail.username ? " (You)" : ""}</Link>
                                        </p>
                                        <p className="text-xs sm:text-sm font-light text-gray-400">{new Date(imageDetail.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        className="rounded-full bg-neutral-900 hover:bg-black text-white px-5 py-2 shadow-md gap-2 disabled:opacity-60"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></svg>
                                        {downloading ? "Downloading..." : "Download"}
                                    </Button>

                                    <div className="flex items-center gap-1 bg-white/70 rounded-full pl-3 pr-2 py-1 border border-white shadow-xs">
                                        <h2 className="font-semibold">{likesCount}</h2>
                                        {liked ? (
                                            <svg onClick={() => handleLike()} className="cursor-pointer hover:scale-110 transition" width="36" height="36" viewBox="0 0 48 48" ><path fill="#E11A45" stroke="#1f2937" d="m43,17.0766c0-5.6539-4.5835-10.2373-10.2374-10.2373-3.7223,0-6.9708,1.9932-8.7626,4.964-1.7919-2.9708-5.0403-4.964-8.7626-4.964-5.6539,0-10.2373,4.5834-10.2373,10.2373,0,1.2925.2496,2.524.6866,3.6627,3.3851,9.7368,18.3134,20.4215,18.3134,20.4215,0,0,14.9282-10.6847,18.3134-20.4215.437-1.1386.6867-2.3702.6867-3.6627Z" /></svg>
                                        ):(
                                            <svg onClick={() => handleLike()} className="cursor-pointer hover:scale-110 transition" width="32" height="32" viewBox="0 0 48 48"><path fill="none" stroke="#1f2937" d="m43,17.0766c0-5.6539-4.5835-10.2373-10.2374-10.2373-3.7223,0-6.9708,1.9932-8.7626,4.964-1.7919-2.9708-5.0403-4.964-8.7626-4.964-5.6539,0-10.2373,4.5834-10.2373,10.2373,0,1.2925.2496,2.524.6866,3.6627,3.3851,9.7368,18.3134,20.4215,18.3134,20.4215,0,0,14.9282-10.6847,18.3134-20.4215.437-1.1386.6867-2.3702.6867-3.6627Z" /></svg>
                                        )}
                                    </div>

                                    {username === imageDetail.username && (
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
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!imageDetail && (
                    <div className="w-full max-w-6xl mb-8" aria-busy="true">
                        <div className="skeleton rounded-3xl h-[60vh]" />
                    </div>
                )}

                <div className="w-full max-w-full bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60 p-6 sm:p-8 flex flex-col">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">Comments</h2>
                    {comments && comments.length > 0 ? (
                        <>
                        <div className="flex flex-wrap gap-4 w-full mb-6">
                            {comments.map((commentItem) => (
                                <Comments 
                                    key={commentItem.id}
                                    commentItem={commentItem}
                                    username={username}
                                    imageId={id}
                                    page={page}
                                    getComments={getComments}
                                    setComments={setComments}
                                />
                            ))}
                        </div>
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
                        </>
                    ) : (
                        <p className="text-lg font-medium text-gray-400 text-center py-6">No Comments yet. Be the first to comment!</p>
                    )}

                    {username ? (
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
                    ) : (
                        <div className="bg-white/80 rounded-2xl p-4 border border-white/80 flex flex-col items-center gap-3 mt-auto shadow-inner">
                            <p className="text-gray-600 text-center">Log in to like this image or join the conversation.</p>
                            <Link href={loginUrl(`/image/${id}`)}>
                                <Button className="bg-neutral-900 hover:bg-black text-white font-medium px-6 py-2.5 rounded-full transition shadow-lg">
                                    Log in
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}