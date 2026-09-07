"use client"

import Link from "next/dist/client/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Login() {
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const router = useRouter()

    function clickLogin() {
        console.log(email, username, password)
        if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i) || username.length <= 5 || password.length <= 8) {
            return alert("One of criteria is not fulfilled")
        } else {
            router.push("/login")
        }
    }

    return (
        <div className="w-screen h-screen bg-gray-300 flex flex-col items-center justify-center">
            <h1 className="text-center text-black mb-5 text-5xl">Register Page</h1>
            <div className="h-100 w-150 bg-gray-50 flex flex-col">
                <form className="flex flex-col items-center justify-center w-full h-full mt-5">
                    <input className="text-black" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)}/>
                    <input className="text-black" type="text" placeholder="Username" minLength={5} required value={username} onChange={(e) => setUsername(e.target.value)}/>
                    <input className="text-black mt-2" type="password" placeholder="Password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)}/>
                    <button type="submit" onClick={clickLogin} className="text-black bg-gray-500 mt-4 px-3 py-2">Register</button>
                </form>
                <Link href="/login" className="bg-gray-200 text-black mt-4 px-3 py-4">Login</Link>
            </div>
        </div>
    )
}