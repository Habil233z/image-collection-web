"use client";

import Header from "@/components/header";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ImageDetail() {
    const params = useParams();
    const id = params?.id;

    const [username, setUsername] = useState<string | null>(null);
    const [imageDetail, setImageDetail] = useState<any>(null);

    async function getImageDetail(targetId: any) {
        try {
            const response = await api.get(`http://localhost:8080/image/${targetId}`);
            setImageDetail(response.data.data);
            console.log("Fetched image data:", response.data.data);
        } catch (error) {
            console.log("Error fetching image detail:", error);
        }
    }

    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        setUsername(storedUsername);

        // Only call API if id is defined and ready
        if (id) {
            getImageDetail(id);
        }
    }, [id]);

    return (
        <>
            <Header username={username} />

            <div>
                {imageDetail ? (
                    <div>
                        <h1>{imageDetail.image_name}</h1>
                        <p>User ID: {imageDetail.user_id}</p>
                        <img src={`http://localhost:8080/${imageDetail.image_path}`} className="max-h-150 w-auto object-cover"></img>
                    </div>
                ) : (
                    <p>Loading image details...</p>
                )}
            </div>
        </>
    );
}