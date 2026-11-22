"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/header";
import Avatar from "@/components/avatar";
import UserContent from "@/components/user-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";
import { getStoredUsername, loginUrl } from "@/lib/auth";
import { usePageTitle } from "@/lib/usePageTitle";

interface UserProfile {
    id: number;
    username: string;
    avatar_url: string;
    image_count: number;
    follower_count: number;
    following_count: number;
    is_me: boolean;
    is_following: boolean;
    is_followed_by: boolean;
}

export default function UserPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [viewer, setViewer] = useState<string | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [followBusy, setFollowBusy] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    usePageTitle(user?.username);

    const loadUser = useCallback(async () => {
        try {
            const res = await api.get(`users/${id}`);
            const data: UserProfile = res.data.data;
            if (data.is_me) {
                router.replace("/profile");
                return;
            }
            setUser(data);
            setNotFound(false);
        } catch (err: any) {
            console.error("Failed to load user:", err);
            if (err?.response?.status === 404 || err?.response?.status === 400) setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        setViewer(getStoredUsername());
        setLoading(true);
        loadUser();
    }, [loadUser]);

    async function toggleFollow() {
        if (!user || followBusy) return;
        if (!viewer) {
            router.push(loginUrl(`/user/${id}`));
            return;
        }
        const previous = user;
        const nowFollowing = !user.is_following;
        setUser({
            ...user,
            is_following: nowFollowing,
            follower_count: Math.max(0, user.follower_count + (nowFollowing ? 1 : -1)),
        });
        setFollowBusy(true);
        try {
            const res = nowFollowing
                ? await api.post(`api/users/${id}/follow`)
                : await api.delete(`api/users/${id}/follow`);
            setUser((u) => u ? { ...u, is_following: res.data.is_following, follower_count: res.data.follower_count } : u);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            console.error("Failed to update follow:", err);
            setUser(previous);
        } finally {
            setFollowBusy(false);
        }
    }

    function openChat() {
        if (!viewer) {
            router.push(loginUrl(`/chat/${id}`));
            return;
        }
        router.push(`/chat/${id}`);
    }

    return (
        <div className="page-bg min-h-screen w-full flex flex-col">
            <Header username={viewer} />

            <main className="flex-1 px-4 sm:px-8 py-8 w-full max-w-6xl mx-auto flex flex-col items-center gap-8">
                {loading && <div className="skeleton rounded-3xl h-52 w-full max-w-2xl" aria-busy="true" />}

                {!loading && notFound && (
                    <div className="glass-card rounded-3xl p-8 max-w-md text-center">
                        <p className="text-2xl font-bold text-gray-800 mb-2">User not found</p>
                        <p className="text-sm text-gray-500 mb-4">This account doesn&apos;t exist or was removed.</p>
                        <Link href="/" className="inline-block bg-neutral-900 hover:bg-black text-white font-medium px-6 py-2.5 rounded-full shadow-md transition">
                            Back to images
                        </Link>
                    </div>
                )}

                {!loading && !notFound && !user && (
                    <div className="glass-card rounded-3xl p-8 max-w-md text-center">
                        <p className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</p>
                        <p className="text-sm text-gray-500">We couldn&apos;t load this profile. Please try again.</p>
                    </div>
                )}

                {user && (
                    <>
                        <Card className="w-full max-w-2xl glass-card rounded-3xl tile-in p-6 sm:p-8">
                            <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-0">
                                <div className="relative shrink-0">
                                    <div className="absolute -inset-1.5 rounded-full bg-linear-to-br from-sky-400 to-blue-500 blur-sm opacity-70" />
                                    <div className="relative h-32 w-32 sm:h-36 sm:w-36 rounded-full overflow-hidden bg-white border-4 border-white shadow-xl">
                                        <Avatar src={user.avatar_url} alt={user.username} className="h-full w-full ring-0 shadow-none" />
                                    </div>
                                </div>

                                <div className="flex-1 w-full flex flex-col items-center sm:items-start gap-4 min-w-0">
                                    <div className="text-center sm:text-left min-w-0 max-w-full">
                                        <p className="text-3xl font-bold text-gray-900 truncate">{user.username}</p>
                                        {user.is_followed_by && (
                                            <span className="inline-block mt-1 text-xs font-semibold text-sky-700 bg-sky-100 rounded-full px-2.5 py-0.5">
                                                Follows you
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                        <Button
                                            onClick={toggleFollow}
                                            disabled={followBusy}
                                            className={`px-6 py-2.5 h-auto rounded-full transition shadow-lg text-base font-medium ${user.is_following ? "bg-white text-gray-800 hover:bg-red-50 hover:text-red-600 border border-gray-300" : "bg-neutral-900 hover:bg-black text-white"}`}
                                        >
                                            {user.is_following ? "Following" : "Follow"}
                                        </Button>
                                        <Button
                                            onClick={openChat}
                                            variant="outline"
                                            className="px-6 py-2.5 h-auto rounded-full border-gray-300 text-gray-700 hover:bg-white transition text-base"
                                        >
                                            Message
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <UserContent
                            userId={user.id}
                            counts={{ images: user.image_count, followers: user.follower_count, following: user.following_count }}
                            refreshKey={refreshKey}
                        />
                    </>
                )}
            </main>
        </div>
    );
}
