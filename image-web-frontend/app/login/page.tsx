"use client"

import Link from "next/dist/client/link"
import { useState } from "react"
import { useRouter } from 'next/navigation'
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Login() {
    const [emailOrUsername, setEmailOrUsername] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter()

    async function clickLogin(e: any) {
        e.preventDefault()
        console.log(emailOrUsername, password)
        try {
            const response = await api.post("http://localhost:8080/login", {emailOrUsername, password}, {withCredentials: true})
            localStorage.setItem("username", response.data.data)
            router.push("/")
        } catch (err) {
            alert("User didn't exist or wrong password")
            console.log(err)
        }
        
    }

    return (
        <>
        <div className="w-screen h-screen bg-gray-300 flex flex-col items-center justify-center">
            <Card className="min-h-[33%] min-w-[40%]">
                <CardHeader>
                    <CardTitle className="text-center text-4xl font-bold mt-6">Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center w-full h-full">
                        <form  className="flex flex-col items-center w-full h-full" autoComplete="off">
                            <div className="w-[60%]">
                                <h2 className="text-xl">Email or Username</h2>
                                <input className="text-black border rounded-md text-xl pl-2 w-full" type="text" placeholder="Email or Username" minLength={5} required onChange={(e) => setEmailOrUsername(e.target.value)} value={emailOrUsername}/>
                                <h2 className="text-xl">Password</h2>
                                <input className="text-black border rounded-md text-xl pl-2 w-full" type="password" placeholder="Password" minLength={8} required onChange={(e) => setPassword(e.target.value)} value={password}/>
                            </div>
                            <Button className="m-4" onClick={e => {clickLogin(e)}}>Login</Button>
                            <hr className="w-[60%]"></hr>
                        </form>
                        <div className="w-[60%] flex justify-end">
                            <h3 className="text-xl pb-2 mt-4">didn't have an account?<Link href="/register"><Button>Register</Button></Link></h3>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        </>
    )
}