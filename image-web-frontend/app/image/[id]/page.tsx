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
        if (id) {
            getImageDetail(id);
        }
    }, [id]);

    return (
        <>
            <Header username={username} />

            <div className="h-full w-full px-4 flex flex-col items-center justify-center">
                {imageDetail ? (
                    <div className="bg-white shadow-2xl rounded-2xl p-4">
                        <h2 className="text-6xl font-bold text-center">{imageDetail.image_name}</h2>
                        <div>
                        <img src={`http://localhost:8080/${imageDetail.image_path}`} className="max-h-150 w-auto object-cover"></img>
                        <h2>Created at:{new Date(imageDetail.created_at).toLocaleDateString()}</h2>
                        <h2 className="text-2xl">Created by {imageDetail.username}</h2>
                        </div>
                    </div>
                ) : (
                    <p>Loading image details...</p>
                )}
            </div>
        </>
    );
}