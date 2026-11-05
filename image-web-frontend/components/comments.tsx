"use client";

import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuGroup, 
    DropdownMenuItem, 
    DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface CommentItemProps {
    commentItem: any;
    username: string | null;
    imageId: string;
    page: number;
    getComments: (page: number) => void;
    setComments: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function Comments({
    commentItem,
    username,
    imageId,
    page,
    getComments,
    setComments
}: CommentItemProps) {

    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [editCommentText, setEditCommentText] = useState<string>("");
    const [liked, setLiked] = useState<boolean>(false);
    const [likeCount, setLikeCount] = useState<number>(0);

    const [isReplying, setIsReplying] = useState<boolean>(false);
    const [reply, setReply] = useState<string>("");

    const [showReplies, setShowReplies] = useState<boolean>(false);
    const [replies, setReplies] = useState<any[]>([]);
    const [repliesCount, setRepliesCount] = useState<number>(0)
    
    async function getLike() {
        try {
            const response = await api.get(`http://localhost:8080/image/${imageId}/comment/${commentItem.id}/likes`);
            setLiked(response.data.liked);
            setLikeCount(response.data.likeCount);
        } catch (error) {
            console.log("Failed to fetch like status", error);
        }
    }
    
    async function handleLike() {
        try {
            await api.post(`http://localhost:8080/api/image/${imageId}/comment/${commentItem.id}/like`);
        } catch (error) {
            console.log(error);
        }
    }

    async function editComment() {
        try {
            if (!editCommentText.trim()) {
                const input = document.getElementById("editCommentInput") as HTMLInputElement;
                input?.reportValidity();
                return;
            }
            await api.patch(`http://localhost:8080/api/image/${imageId}/comment/${commentItem.id}`, { editCommentText });
            alert("Comment has been edited");
            setIsDialogOpen(false);
            getComments(page);
        } catch (error) {
            console.log(error);
        }
    }

    async function deleteComment() {
        if (!window.confirm("Are you sure you want to delete this comment?")) {
            return;
        }
        try {
            await api.delete(`http://localhost:8080/api/image/${imageId}/comment/${commentItem.id}`);
            setComments([]);
            getComments(page);
        } catch (error) {
            console.log(error);
        }
    }

    async function getReplyCount() {
        try {
            const response = await api.get(`http://localhost:8080/image/${imageId}/comment/${commentItem.id}/replies/count`)
            setRepliesCount(response.data.replyCount)
        } catch (error) {
            console.log(error)
        }
    }

    async function getReply() {
        try {
            const response = await api.get(`http://localhost:8080/image/${imageId}/comment/${commentItem.id}/replies`);
            setReplies(response.data.data || []);
        } catch (error) {
            console.log(error);
        }
    }

    async function handleToggleReplies() {
        if (!showReplies) {
            await getReply();
        }
        setShowReplies(!showReplies);
    }

    async function replyComment(commentId: any) {
    if (!reply.trim()) return;
    try {
      await api.post(`http://localhost:8080/api/image/${imageId}/comment/${commentId}/reply`, { reply });
      setReply("");
      setIsReplying(false);
      getReply();
    } catch (error) {
      console.error("Failed to post reply:", error);
    }
  }

    useEffect(() => {
        getLike()
        getReplyCount()
    }, []);

    return (
        <>
        <div key={commentItem.id} className="bg-white/80 backdrop-blur-xs rounded-2xl border border-white/80 p-4 sm:p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between self-start">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-white overflow-hidden border border-gray-200 shrink-0 shadow-inner">
                        <img className="h-full w-full object-cover" src="test" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/user.png" }} alt="User Avatar" />
                    </div>
                    <div>
                        <div className="flex justify-between w-full">
                            <h3 className="text-base font-semibold text-gray-900">{commentItem.username}</h3>
                            <p className="text-gray-400 ml-4">{new Date(commentItem.created_at).toLocaleDateString()}</p>
                        </div>
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
                                        }} 
                                        className="cursor-pointer font-medium rounded-xl px-3 py-1.5 focus:bg-sky-50 focus:text-sky-600 transition"
                                    >
                                        Edit
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator className="my-1 border-gray-100" />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem 
                                        onClick={() => deleteComment()} 
                                        className="cursor-pointer text-red-600 font-medium rounded-xl px-3 py-1.5 focus:bg-red-50 focus:text-red-700 transition">
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <div>
                    <button
                        onClick={handleToggleReplies}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
                    >
                        {showReplies ? "Hide Replies" : "View Replies"}
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 cursor-pointer" onClick={handleLike}>
                        {liked ? (
                            <svg width="28" height="28" viewBox="0 0 48 48"><path fill="#E11A45" stroke="#1f2937" d="m43,17.0766c0-5.6539-4.5835-10.2373-10.2374-10.2373-3.7223,0-6.9708,1.9932-8.7626,4.964-1.7919-2.9708-5.0403-4.964-8.7626-4.964-5.6539,0-10.2373,4.5834-10.2373,10.2373,0,1.2925.2496,2.524.6866,3.6627,3.3851,9.7368,18.3134,20.4215,18.3134,20.4215,0,0,14.9282-10.6847,18.3134-20.4215.437-1.1386.6867-2.3702.6867-3.6627Z" /></svg>
                        ):(
                            <svg width="28" height="28" viewBox="0 0 48 48"><path fill="none" stroke="#1f2937" d="m43,17.0766c0-5.6539-4.5835-10.2373-10.2374-10.2373-3.7223,0-6.9708,1.9932-8.7626,4.964-1.7919-2.9708-5.0403-4.964-8.7626-4.964-5.6539,0-10.2373,4.5834-10.2373,10.2373,0,1.2925.2496,2.524.6866,3.6627,3.3851,9.7368,18.3134,20.4215,18.3134,20.4215,0,0,14.9282-10.6847,18.3134-20.4215.437-1.1386.6867-2.3702.6867-3.6627Z" /></svg>
                        )}
                        <span className="text-sm font-medium text-gray-700">{likeCount}</span>
                    </div>
                    <div className="flex justify-end items-center mt-1">
                        <button
                        onClick={() => setIsReplying(!isReplying)}
                        className="text-xs font-medium text-sky-600 hover:text-sky-700 transition"
                        >
                        {isReplying ? "Cancel Reply" : "Reply"}
                        </button>
                    </div>
                    <h1>{repliesCount}</h1>
                </div>
            </div>
            {isReplying && (
                <div className="flex flex-col gap-2 mt-2 pl-4 border-l-2 border-sky-200">
                <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={`Reply to ${commentItem.username}...`}
                    required
                    className="w-full text-black border border-gray-200 rounded-xl text-xs sm:text-sm px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-400 transition"
                />
                <div className="flex justify-end gap-2">
                    <Button
                    onClick={() => replyComment(commentItem.id)}
                    className="bg-neutral-900 hover:bg-black text-white text-xs px-4 py-1.5 rounded-full transition shadow-xs"
                    >
                    Sent reply
                    </Button>
                </div>
                </div>
            )}

            {showReplies && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200 flex flex-col gap-3">
                    {replies.length > 0 ? (
                        replies.map((replyItem) => (
                            <div key={replyItem.id} className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-900 text-xs sm:text-sm">{replyItem.username}</span>
                                    <span className="text-[10px] text-gray-400">{new Date(replyItem.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-700 text-xs sm:text-sm break-all">{replyItem.reply}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs">No replies yet.</p>
                    )}
                </div>
            )}
        </div>

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
                            <Button onClick={() => editComment()} className="bg-neutral-900 hover:bg-black text-white rounded-full px-6 py-2.5 shadow-lg">Save Comment</Button>                         </div>
                    </div>
                </DialogHeader>
            </DialogContent>
        </Dialog>
        </>
    );
}