"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react";
import Header from "@/components/header";
import api from "@/lib/api";
import { setStoredAvatar } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Profile() {
    const [username, setUsername] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [avatar, setAvatar] = useState<string>("");
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

            <main className="flex-1 px-4 sm:px-6 py-8 flex justify-center items-start pt-6">
                <Card className="w-full max-w-md glass-card rounded-3xl tile-in p-6 sm:p-8 flex flex-col items-center">
                    <CardHeader className="flex flex-col justify-center items-center pb-4 text-center">
                        <div className="relative mb-4">
                            <div className="absolute -inset-1.5 rounded-full bg-linear-to-br from-sky-400 to-blue-500 blur-sm opacity-70" />
                            <div className={`relative h-36 w-36 rounded-full overflow-hidden bg-white border-4 border-white shadow-xl ${loading ? "skeleton" : ""}`}>
                                {!loading && (
                                    <img
                                        className="h-full w-full object-cover"
                                        src={avatar || "/user.png"}
                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/user.png"; }}
                                        alt="User Profile Avatar"
                                    />
                                )}
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold text-gray-900">My Profile</CardTitle>
                    </CardHeader>

                    <CardContent className="w-full flex flex-col items-center space-y-6">
                        <div className="text-center space-y-1">
                            <p className="text-2xl font-bold text-gray-800">{username || "Loading..."}</p>
                            <p className="text-sm text-gray-500 font-light">{email || "Loading..."}</p>
                        </div>

                        <div className="w-full flex flex-col gap-3">
                            <Link href="/profile/edit" className="w-full">
                                <Button className="w-full bg-neutral-900 hover:bg-black text-white font-medium py-3 rounded-full transition shadow-lg text-base">
                                    Edit Profile
                                </Button>
                            </Link>
                            <Link href="/liked" className="w-full">
                                <Button variant="outline" className="w-full py-3 rounded-full border-gray-300 text-gray-700 hover:bg-white transition text-base">
                                    ♥ My Liked Images
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
