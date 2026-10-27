"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react";
import Header from "@/components/header";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function EditProfile() {
    const [username, setUsername] = useState<string>("");
    const [email, setEmail] = useState<string>("");

    const router = useRouter()

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

    async function handleEditProfile(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        try {
            const newProfileData = new FormData(e.currentTarget)
            await api.patch("http://localhost:8080/api/profile", newProfileData)
            alert("Profile edit successful")
            router.push(`/profile`)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getProfile()
    }, []);

    return (
        <div className="min-h-screen w-screen bg-linear-to-br from-sky-100 via-sky-200 to-blue-300 flex flex-col">
            <Header username={username} />

            <main className="flex-1 px-6 py-8 flex justify-center items-start pt-6">
                <Card className="w-full max-w-md shadow-2xl rounded-3xl border border-white/60 bg-white/90 backdrop-blur-md p-6 sm:p-8 flex flex-col items-center">
                    <CardHeader className="flex flex-col justify-center items-center pb-4 text-center">
                        <div className="h-28 w-28 rounded-full overflow-hidden bg-white border-4 border-white shadow-md mb-2">
                            <img 
                                className="h-full w-full object-cover" 
                                src="/" 
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/user.png"; }} 
                                alt="Profile Avatar"
                            />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Edit Profile</CardTitle>
                    </CardHeader>

                    <CardContent className="w-full">
                        <form onSubmit={handleEditProfile} className="flex flex-col gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Email</label>
                                <input 
                                    className="w-full text-black border border-gray-200 rounded-xl text-sm sm:text-base px-4 py-3 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 transition" 
                                    type="email" 
                                    name="email" 
                                    placeholder="Email" 
                                    required 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Username</label>
                                <input 
                                    className="w-full text-black border border-gray-200 rounded-xl text-sm sm:text-base px-4 py-3 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 transition" 
                                    type="text" 
                                    name="username" 
                                    placeholder="Username" 
                                    minLength={5} 
                                    required 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            <Button type="submit" className="w-full bg-neutral-900 hover:bg-black text-white font-medium py-3 rounded-full transition shadow-lg text-base mt-2">
                                Save Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}