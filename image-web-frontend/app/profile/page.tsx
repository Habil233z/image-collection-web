"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react";
import Header from "@/components/header";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Profile() {
    const [username, setUsername] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    async function getProfile() {
        try {
            const response = await api.get("http://localhost:8080/api/profile")
            setUsername(response.data.data.username)
            localStorage.setItem("username", response.data.data.username)
            setEmail(response.data.data.email)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        getProfile()
    }, []);

    return (
        <div className="min-h-screen w-screen bg-linear-to-br from-sky-100 via-sky-200 to-blue-300 flex flex-col">
            <Header username={username} />

            <main className="flex-1 px-6 py-8 flex justify-center items-start pt-12">
                <Card className="w-full max-w-md shadow-2xl rounded-3xl border border-white/60 bg-white/90 backdrop-blur-md p-6 sm:p-8 flex flex-col items-center">
                    <CardHeader className="flex flex-col justify-center items-center pb-4 text-center">
                        <div className="h-32 w-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-md mb-3">
                            <img 
                                className="h-full w-full object-cover" 
                                src="/" 
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/user.png"; }} 
                                alt="User Profile Avatar"
                            />
                        </div>
                        <div className="w-40">
                        <CardTitle className="text-3xl font-bold text-gray-900">My Profile</CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="w-full flex flex-col items-center space-y-6">
                        <div className="text-center space-y-1">
                            <p className="text-2xl font-bold text-gray-800">{username || "Loading..."}</p>
                            <p className="text-sm text-gray-500 font-light">{email || "Loading..."}</p>
                        </div>

                        <Link href="/profile/edit" className="w-full">
                            <Button className="w-full bg-neutral-900 hover:bg-black text-white font-medium py-3 rounded-full transition shadow-lg text-base">
                                Edit Profile
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}