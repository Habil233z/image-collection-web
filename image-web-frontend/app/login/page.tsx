"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from 'next/navigation'
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { clearSession, safeRedirectPath } from "@/lib/auth"

export default function Login() {
    const [emailOrUsername, setEmailOrUsername] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter()

async function clickLogin(e: React.FormEvent) {
    e.preventDefault()
    console.log("Attempting login...")
    
    try {
        const response = await api.post("login", { emailOrUsername, password })
        clearSession()
        if (response.data && response.data.data) {
            localStorage.setItem("username", response.data.data)
        }
        const redirect = new URLSearchParams(window.location.search).get("redirect")
        router.push(safeRedirectPath(redirect))
    } catch (err: any) {
        console.error("Login failed:", err)
        alert(err.response?.data?.message || "Login failed")
    }
}

    return (
        <div className="page-bg-deep min-h-screen w-full flex flex-col items-center justify-center px-4">
            <Card className="w-full max-w-md glass-card rounded-3xl tile-in p-6 sm:p-8">
                <CardHeader className="space-y-3 pb-6 text-center">
                    <div className="mx-auto w-12 h-12 p-2 rounded-full bg-sky-100 flex items-center justify-center shadow-inner text-sky-600 font-bold text-lg">
                        <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none">
                            <path d="M8 16C8 18.8284 8 20.2426 8.87868 21.1213C9.75736 22 11.1716 22 14 22H15C17.8284 22 19.2426 22 20.1213 21.1213C21 20.2426 21 18.8284 21 16V8C21 5.17157 21 3.75736 20.1213 2.87868C19.2426 2 17.8284 2 15 2H14C11.1716 2 9.75736 2 8.87868 2.87868C8 3.75736 8 5.17157 8 8" stroke="#1C274C" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M8 19.5C5.64298 19.5 4.46447 19.5 3.73223 18.7678C3 18.0355 3 16.857 3 14.5V9.5C3 7.14298 3 5.96447 3.73223 5.23223C4.46447 4.5 5.64298 4.5 8 4.5" stroke="#1C274C" strokeWidth="1.5"/>
                            <path d="M6 12L15 12M15 12L12.5 14.5M15 12L12.5 9.5" stroke="#1C274C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Sign in to Image Web</CardTitle>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                        Share images and react to other creation
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={clickLogin} className="flex flex-col gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Email or Username</label>
                            <input 
                                className="field text-sm sm:text-base" 
                                type="text" 
                                placeholder="email or username" 
                                minLength={5} 
                                required 
                                onChange={(e) => setEmailOrUsername(e.target.value)} 
                                value={emailOrUsername}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Password</label>
                            </div>
                            <input 
                                className="field text-sm sm:text-base" 
                                type="password" 
                                placeholder="password" 
                                minLength={8} 
                                required 
                                onChange={(e) => setPassword(e.target.value)} 
                                value={password}
                            />
                        </div>

                        <Button type="submit" className="w-full bg-neutral-900 hover:bg-black text-white font-medium py-3 rounded-full transition shadow-lg mt-2 text-base">
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        <span>Don't have an account? </span>
                        <Link href="/register" className="font-semibold text-sky-600 hover:text-sky-700 hover:underline">
                            Register
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}