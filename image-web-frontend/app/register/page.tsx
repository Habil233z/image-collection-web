"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from 'next/navigation'
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Register() {
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const router = useRouter()

    async function clickRegister(e: React.FormEvent) {
        e.preventDefault()
        if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i) || username.length < 5 || password.length < 8) {
            return alert("Please ensure email is valid, username is at least 5 characters, and password is at least 8 characters.")
        } else {
            try {
                const response = await api.post("http://localhost:8080/register", { email, username, password })
                localStorage.setItem("username", response.data.data)
                router.push("/")
            } catch {
                alert("User has already been created")
            }
        }
    }

    return (
        <div className="w-screen h-screen bg-linear-to-br from-sky-200 via-sky-300 to-blue-400 flex flex-col items-center justify-center px-4 overflow-y-auto py-6">
            <Card className="w-full max-w-md shadow-2xl rounded-3xl border border-white/60 bg-white/90 backdrop-blur-md p-6 sm:p-8 my-auto">
                <CardHeader className="space-y-3 pb-6 text-center">
                    <div className="mx-auto w-12 h-12 p-2 rounded-full bg-sky-100 flex items-center justify-center shadow-inner text-sky-600 font-bold text-lg">
                        <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="#1C274C"/>
                        </svg>
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Create an Account</CardTitle>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                        Join Image Web to share images and react to other creations
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={clickRegister} className="flex flex-col gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Email</label>
                            <input 
                                className="w-full text-black border border-gray-200 rounded-xl text-sm sm:text-base px-4 py-3 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 transition" 
                                type="email" 
                                placeholder="email@gmail.com" 
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
                                placeholder="At least 5 characters" 
                                minLength={5} 
                                required 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Password</label>
                            <input 
                                className="w-full text-black border border-gray-200 rounded-xl text-sm sm:text-base px-4 py-3 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 transition" 
                                type="password" 
                                placeholder="At least 8 characters" 
                                minLength={8} 
                                required 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full bg-neutral-900 hover:bg-black text-white font-medium py-3 rounded-full transition shadow-lg mt-2 text-base">
                            Register
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        <span>Already have an account? </span>
                        <Link href="/login" className="font-semibold text-sky-600 hover:text-sky-700 hover:underline">
                            Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}