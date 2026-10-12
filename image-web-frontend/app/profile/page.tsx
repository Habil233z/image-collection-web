"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import api from "@/lib/api";

export default function Home() {
    const [username, setUsername] = useState<string | null>(null);

    async function getProfile() {
        try {
            const response = await api.get("http://localhost:8080/api/profile")
            console.log(response.data.data)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        setUsername(storedUsername);
        getProfile()
    }, []);

    return (
        <>
        <Header username={username} />
        <h1></h1>
        </>
    );
}