"use client"

import Link from "next/dist/client/link"

export default function Login() {
    return (
        <div className="w-screen h-screen bg-gray-300 flex flex-col items-center justify-center">
            <h1 className="text-center text-black mb-5 text-5xl">Login Page</h1>
            <div className="h-100 w-150 bg-gray-50 flex flex-col">
                <form className="flex flex-col items-center justify-center w-full h-full mt-5">
                    <input className="text-black" type="text" placeholder="Email or Username" minLength={5} required/>
                    <input className="text-black mt-2" type="password" placeholder="Password" minLength={8} required/>
                    <button className="text-black bg-gray-500 mt-4 px-3 py-2">Login</button>
                </form>
                <Link href="/register" className="bg-gray-200 text-black mt-4 px-3 py-4">Register</Link>
            </div>
        </div>
    )
}