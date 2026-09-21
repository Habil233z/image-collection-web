"use client"

import api from "@/lib/api"
import Link from "next/dist/client/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Register() {
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const router = useRouter()

    async function clickRegister(e: any) {
        e.preventDefault()
        console.log(email, username, password)
        if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i) || username.length <= 5 || password.length <= 8) {
            return alert("One of criteria is not fulfilled")
        } else {
            try {
                await api.post("http://localhost:8080/register", {email, username, password})
                console.log("Register successfull")
                router.push("/login")
            } catch {
                console.log("Register failed")
            }
        }
    }

    return (
        <div className="w-screen h-screen bg-gray-300 flex flex-col items-center justify-center">
            <h1 className="text-center text-black mb-5 text-5xl">Register Page</h1>
            <div className="h-100 w-150 bg-gray-50 flex flex-col">
                <form className="flex flex-col items-center justify-center w-full h-full mt-5" autoComplete="off">
                    <input className="text-black" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)}/>
                    <input className="text-black" type="text" placeholder="Username" minLength={5} required value={username} onChange={(e) => setUsername(e.target.value)}/>
                    <input className="text-black mt-2" type="password" placeholder="Password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)}/>
                    <button type="submit" onClick={e => {clickRegister(e)}} className="text-black bg-gray-500 mt-4 px-3 py-2">Register</button>
                </form>
                <Link href="/login" className="bg-gray-200 text-black mt-4 px-3 py-4">Login</Link>
            </div>
        </div>
    )
}