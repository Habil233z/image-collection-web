"use client";

import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react";
import Header from "@/components/header";
import api from "@/lib/api";

export default function Home() {
    const [username, setUsername] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);

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

    useEffect(() => {
        getProfile()
    }, []);

    return (
        <>
        <Header username={username} />

        <div className="w-full h-full flex justify-center">
            <Card className="w-[50%] mt-10">
                <CardHeader className="flex flex-col justify-center items-center">
                    <CardTitle className="text-5xl font-semibold">Profile:</CardTitle>
                    <div className="h-40 w-40 rounded-full bg-gray-500">
                        
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col justify-center items-center">
                    <p className="text-4xl font-medium">{username}</p>
                    <p className="text-3xl font-extralight">{email}</p>
                </CardContent>
                <CardFooter>
                    <p>Card Footer</p>
                </CardFooter>
            </Card>
        </div>
        </>
    );
}