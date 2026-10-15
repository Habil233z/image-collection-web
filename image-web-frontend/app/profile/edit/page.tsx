"use client";

import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
            console.log(response.data.data)
        } catch (err) {
            console.log(err)
        }
    }

    async function handleEditProfile(e: any) {
    e.preventDefault()
    try {
      const newProfileData = new FormData(e.currentTarget)
      await api.patch("http://localhost:8080/api/profile", newProfileData)
      alert("Profile edit successfull")
      router.push(`/profile`)
    } catch (error) {
      console.log(error)
    }
  }

    useEffect(() => {
        getProfile()
    }, []);

    return (
        <>
        <Header username={username} />

        <div className="w-full h-full flex justify-center">
            <Card className="min-w-[20%] mt-10 flex flex-col items-center p-4">
                <CardHeader className="flex flex-col justify-center items-center">
                    <CardTitle className="text-5xl font-semibold">Profile:</CardTitle>
                    <div className="h-40 w-40 rounded-full bg-gray-500">
                        
                    </div>
                </CardHeader>
                <form onSubmit={handleEditProfile} className="flex flex-col justify-center items-center">
                        <h2 className="text-xl">Email</h2>
                        <input className="text-black border rounded-md text-xl pl-2 w-full" type="email" name="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)}/>
                        <h2 className="text-xl">Username</h2>
                        <input className="text-black border rounded-md text-xl pl-2 w-full" type="text" name="username" placeholder="Username" minLength={5} required value={username} onChange={(e) => setUsername(e.target.value)}/>
                    <Button className="min-w-20" type="submit">Submit edit</Button>
                </form>
            </Card>
        </div>
        </>
    );
}