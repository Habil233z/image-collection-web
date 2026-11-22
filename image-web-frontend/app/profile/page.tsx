"use client";

import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react";
import Header from "@/components/header";
import api from "@/lib/api";
import { setStoredAvatar } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Avatar from "@/components/avatar";
import UserContent, { type Counts } from "@/components/user-content";

export default function Profile() {
    const [userId, setUserId] = useState<number | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [avatar, setAvatar] = useState<string>("");
    const [counts, setCounts] = useState<Counts>({ images: 0, followers: 0, following: 0 });
    const [loading, setLoading] = useState<boolean>(true);

    async function getProfile() {
        try {
            const response = await api.get("api/profile")
            const data = response.data.data
            setUsername(data.username)
            localStorage.setItem("username", data.username)
            setEmail(data.email)
            setAvatar(data.avatar_url || "")
            setStoredAvatar(data.avatar_url || "")
            setUserId(data.id)

            // follower / following / image counts come from the public user endpoint
            try {
                const stats = await api.get(`users/${data.id}`)
                const s = stats.data.data
                setCounts({ images: s.image_count, followers: s.follower_count, following: s.following_count })
            } catch (err) {
                console.log(err)
            }
        } catch (err) {
            console.log(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getProfile()
    }, []);

    return (
        <div className="page-bg min-h-screen w-full flex flex-col">
            <Header username={username} />

            <main className="flex-1 px-4 sm:px-8 py-8 w-full max-w-6xl mx-auto flex flex-col items-center gap-8">
                <Card className="w-full max-w-2xl glass-card rounded-3xl tile-in p-6 sm:p-8">
                    <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-0">
                        <div className="relative shrink-0">
                            <div className="absolute -inset-1.5 rounded-full bg-linear-to-br from-sky-400 to-blue-500 blur-sm opacity-70" />
                            <div className={`relative h-32 w-32 sm:h-36 sm:w-36 rounded-full overflow-hidden bg-white border-4 border-white shadow-xl ${loading ? "skeleton" : ""}`}>
                                {!loading && (
                                    <Avatar src={avatar} alt="User Profile Avatar" className="h-full w-full ring-0 shadow-none" />
                                )}
                            </div>
                        </div>

                        <div className="flex-1 w-full flex flex-col items-center sm:items-start gap-4 min-w-0">
                            <div className="text-center sm:text-left min-w-0 max-w-full">
                                <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">My Profile</p>
                                <p className="text-3xl font-bold text-gray-900 truncate">{username || "Loading..."}</p>
                                <p className="text-sm text-gray-500 font-light truncate">{email || "Loading..."}</p>
                            </div>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                <Link href="/profile/edit">
                                    <Button className="bg-neutral-900 hover:bg-black text-white font-medium px-6 py-2.5 h-auto rounded-full transition shadow-lg text-base">
                                        Edit Profile
                                    </Button>
                                </Link>
                                <Link href="/liked">
                                    <Button variant="outline" className="px-6 py-2.5 h-auto rounded-full border-gray-300 text-gray-700 hover:bg-white transition text-base">
                                        ♥ Liked Images
                                    </Button>
                                </Link>
                                <Link href="/chat">
                                    <Button variant="outline" className="px-6 py-2.5 h-auto rounded-full border-gray-300 text-gray-700 hover:bg-white transition text-base">
                                        Messages
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {userId !== null && <UserContent userId={userId} counts={counts} />}
            </main>
        </div>
    );
}
