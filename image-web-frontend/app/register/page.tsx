"use client"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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
        <>
        <div className="w-screen h-screen bg-gray-300 flex flex-col items-center justify-center">
            <Card className="min-h-[33%] min-w-[40%]">
                <CardHeader>
                    <CardTitle className="text-center text-4xl font-bold mt-6">Register</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center w-full h-full">
                        <form  className="flex flex-col items-center w-full h-full" autoComplete="off">
                            <div className="w-[60%]">
                                <h2 className="text-xl">Email</h2>
                                <input className="text-black border rounded-md text-xl pl-2 w-full" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)}/>
                                <h2 className="text-xl">Username</h2>
                                <input className="text-black border rounded-md text-xl pl-2 w-full" type="text" placeholder="Username" minLength={5} required value={username} onChange={(e) => setUsername(e.target.value)}/>
                                <h2 className="text-xl">Password</h2>
                                <input className="text-black border rounded-md text-xl pl-2 w-full" type="password" placeholder="Password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)}/>
                            </div>
                            <Button className="m-4" onClick={e => {clickRegister(e)}}>Register</Button>
                            <hr className="w-[60%]"></hr>
                        </form>
                        <div className="w-[60%] flex justify-end">
                            <h3 className="text-xl pb-2 mt-4">Already have an account?<Link href="/login"><Button>login</Button></Link></h3>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        </>
    )
}