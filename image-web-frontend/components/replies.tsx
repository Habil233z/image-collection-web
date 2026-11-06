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

interface ReplyItemProps {
    replyItem: any;
    username: string | null;
    commentUsername: string;
    imageId: string;
    commentId: number;
    getReply: () => void;
}

export default function Replies({
    replyItem,
    username,
    commentUsername,
    imageId,
    commentId,
    getReply
}: ReplyItemProps) {
    const [likedReply, setLikedReply] = useState<boolean>(false);
    const [likeReplyCount, setLikeReplyCount] = useState<number>(0);
    const [isEditReplyDialogOpen, setIsEditReplyDialogOpen] = useState<boolean>(false);
    const [editReplyText, setEditReplyText] = useState<string>(replyItem.reply);

    const isOwner = replyItem.username === commentUsername;

    async function getReplyLike() {
        try {
            const response = await api.get(`http://localhost:8080/image/${imageId}/comment/${commentId}/replies/${replyItem.id}/likes`);
            setLikedReply(response.data.isLiked);
            setLikeReplyCount(response.data.likeCount);
        } catch (error) {
            console.log(error);
        }
    }

    async function handleLikeReply() {
        try {
            await api.post(`http://localhost:8080/api/image/${imageId}/comment/${commentId}/reply/${replyItem.id}/like`);
            getReplyLike();
        } catch (error) {
            console.log(error);
        }
    }

    async function editReply() {
        try {
            if (!editReplyText.trim()) return;
            await api.patch(`http://localhost:8080/api/image/${imageId}/comment/${commentId}/reply/${replyItem.id}`, { editReplyText });
            alert("Reply has been edited");
            setIsEditReplyDialogOpen(false);
            getReply();
        } catch (error) {
            console.log(error);
        }
    }

    async function deleteReply() {
        if (!window.confirm("Are you sure you want to delete this reply?")) {
            return;
        }
        try {
            await api.delete(`http://localhost:8080/api/image/${imageId}/comment/${commentId}/reply/${replyItem.id}`);
            getReply();
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        getReplyLike();
    }, [replyItem.id]);

    return (
        <>
            
                {isOwner ? (
                    <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 flex flex-col gap-1 mr-10">
                    <div className="flex">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-white overflow-hidden border border-gray-200 shrink-0 shadow-inner">
                                <img className="h-full w-full object-cover" src="test" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/user.png" }} alt="User Avatar" />
                            </div>
                            <div>
                                <div className="flex justify-between w-full">
                                    <h3 className="text-sm font-semibold text-gray-900">{replyItem.username}</h3>
                                    <p className="text-gray-400 ml-4 text-xs">{new Date(replyItem.created_at).toLocaleDateString()}</p>
                                </div>
                                <p className="text-gray-600 break-all mt-1 text-xs sm:text-sm">{replyItem.reply}</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            {username === replyItem.username && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="focus:outline-none">
                                        <div className="font-bold text-sm cursor-pointer w-6 h-6 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 transition shadow-xs">
                                            ⋮
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-32 rounded-2xl p-1 shadow-xl bg-white/95 backdrop-blur-md border border-white/80">
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem 
                                                onClick={() => { 
                                                    setEditReplyText(replyItem.reply); 
                                                    setIsEditReplyDialogOpen(true); 
                                                }} 
                                                className="cursor-pointer font-medium rounded-xl px-3 py-1.5 focus:bg-sky-50 focus:text-sky-600 transition text-xs"
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                        <DropdownMenuSeparator className="my-1 border-gray-100" />
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem 
                                                onClick={deleteReply} 
                                                className="cursor-pointer text-red-600 font-medium rounded-xl px-3 py-1.5 focus:bg-red-50 focus:text-red-700 transition text-xs">
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                    <div className="flex w-full justify-end mt-1">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={handleLikeReply}>
                            {likedReply ? (
                                <svg width="24" height="24" viewBox="0 0 48 48"><path fill="#E11A45" stroke="#1f2937" d="m43,17.0766c0-5.6539-4.5835-10.2373-10.2374-10.2373-3.7223,0-6.9708,1.9932-8.7626,4.964-1.7919-2.9708-5.0403-4.964-8.7626-4.964-5.6539,0-10.2373,4.5834-10.2373,10.2373,0,1.2925.2496,2.524.6866,3.6627,3.3851,9.7368,18.3134,20.4215,18.3134,20.4215,0,0,14.9282-10.6847,18.3134-20.4215.437-1.1386.6867-2.3702.6867-3.6627Z" /></svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 48 48"><path fill="none" stroke="#1f2937" d="m43,17.0766c0-5.6539-4.5835-10.2373-10.2374-10.2373-3.7223,0-6.9708,1.9932-8.7626,4.964-1.7919-2.9708-5.0403-4.964-8.7626-4.964-5.6539,0-10.2373,4.5834-10.2373,10.2373,0,1.2925.2496,2.524.6866,3.6627,3.3851,9.7368,18.3134,20.4215,18.3134,20.4215,0,0,14.9282-10.6847,18.3134-20.4215.437-1.1386.6867-2.3702.6867-3.6627Z" /></svg>
                            )}
                            <span className="text-xs font-medium text-gray-700">{likeReplyCount}</span>
                        </div>
                    </div>
                </div>
                ) : (
                <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 flex flex-col gap-1 ml-10">
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col items-end gap-1">
                            {username === replyItem.username && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="focus:outline-none">
                                        <div className="font-bold text-sm cursor-pointer w-6 h-6 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 transition shadow-xs">
                                            ⋮
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-32 rounded-2xl p-1 shadow-xl bg-white/95 backdrop-blur-md border border-white/80">
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem 
                                                onClick={() => { 
                                                    setEditReplyText(replyItem.reply); 
                                                    setIsEditReplyDialogOpen(true); 
                                                }} 
                                                className="cursor-pointer font-medium rounded-xl px-3 py-1.5 focus:bg-sky-50 focus:text-sky-600 transition text-xs"
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                        <DropdownMenuSeparator className="my-1 border-gray-100" />
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem 
                                                onClick={deleteReply} 
                                                className="cursor-pointer text-red-600 font-medium rounded-xl px-3 py-1.5 focus:bg-red-50 focus:text-red-700 transition text-xs">
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="text-right">
                                <div className="flex justify-between w-full">
                                    <p className="text-gray-400 mr-4 text-xs">{new Date(replyItem.created_at).toLocaleDateString()}</p>
                                    <h3 className="text-sm font-semibold text-gray-900">{replyItem.username}</h3>
                                </div>
                                <p className="text-gray-600 break-all mt-1 text-xs sm:text-sm text-right">{replyItem.reply}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white overflow-hidden border border-gray-200 shrink-0 shadow-inner">
                                <img className="h-full w-full object-cover" src="test" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/user.png" }} alt="User Avatar" />
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full justify-end mt-1">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={handleLikeReply}>
                            {likedReply ? (
                                <svg width="24" height="24" viewBox="0 0 48 48"><path fill="#E11A45" stroke="#1f2937" d="m43,17.0766c0-5.6539-4.5835-10.2373-10.2374-10.2373-3.7223,0-6.9708,1.9932-8.7626,4.964-1.7919-2.9708-5.0403-4.964-8.7626-4.964-5.6539,0-10.2373,4.5834-10.2373,10.2373,0,1.2925.2496,2.524.6866,3.6627,3.3851,9.7368,18.3134,20.4215,18.3134,20.4215,0,0,14.9282-10.6847,18.3134-20.4215.437-1.1386.6867-2.3702.6867-3.6627Z" /></svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 48 48"><path fill="none" stroke="#1f2937" d="m43,17.0766c0-5.6539-4.5835-10.2373-10.2374-10.2373-3.7223,0-6.9708,1.9932-8.7626,4.964-1.7919-2.9708-5.0403-4.964-8.7626-4.964-5.6539,0-10.2373,4.5834-10.2373,10.2373,0,1.2925.2496,2.524.6866,3.6627,3.3851,9.7368,18.3134,20.4215,18.3134,20.4215,0,0,14.9282-10.6847,18.3134-20.4215.437-1.1386.6867-2.3702.6867-3.6627Z" /></svg>
                            )}
                            <span className="text-xs font-medium text-gray-700">{likeReplyCount}</span>
                        </div>
                    </div>
                </div>
                )}


            

            <Dialog open={isEditReplyDialogOpen} onOpenChange={setIsEditReplyDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl bg-white/95 backdrop-blur-md border border-white/60 p-6">
                    <DialogHeader className="space-y-4">
                        <DialogTitle className="text-center text-2xl font-bold text-gray-900">Edit Reply</DialogTitle>
                        <div className="flex flex-col gap-4 pt-2">
                            <input 
                                type="text" 
                                className="w-full text-black border border-gray-200 rounded-xl text-sm px-4 py-3 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 transition" 
                                placeholder="Update your reply..." 
                                value={editReplyText} 
                                onChange={(e) => setEditReplyText(e.target.value)} 
                                required
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <Button variant="outline" onClick={() => setIsEditReplyDialogOpen(false)} className="rounded-full px-5 py-2.5 border-gray-300">Cancel</Button>
                                <Button onClick={editReply} className="bg-neutral-900 hover:bg-black text-white rounded-full px-6 py-2.5 shadow-lg">Save Reply</Button>
                            </div>
                        </div>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    );
}