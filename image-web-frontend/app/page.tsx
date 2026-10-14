"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import api from "@/lib/api";

export default function Home() {
  const [username, setUsername] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const image = URL.createObjectURL(file);
      setPreviewImage(image);
    } else {
      setPreviewImage(null);
    }
  }

  async function handleUploadImage(e: any) {
    e.preventDefault()
    try {
      const imageData = new FormData(e.currentTarget)
      await api.post("http://localhost:8080/api/upload", imageData)
      alert("Image upload successfull")
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername);
  }, []);

  return (
    <>
      <Header username={username} />

      <div>
        
      </div>

      <Dialog>
        <DialogTrigger className="fixed bottom-10 right-10 bg-linear-to-r from-blue-300 to-blue-400 p-2 rounded-4xl border-2 border-gray-800">Upload Image</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-4xl">Upload your image</DialogTitle>
              <form onSubmit={handleUploadImage} className="flex flex-col items-center justify-center">
                {previewImage ? 
                  <div className="relative w-40 h-40 mb-2 border rounded-md overflow-hidden">
                    <label><img src={previewImage} alt="Image preview" className="object-cover w-full h-full" /><input type="file" name="imageFile" accept="image/*" className="hidden" onChange={handleFileChange}/></label>
                  </div> :

                  <div className="relative w-40 h-40 mb-2 border rounded-md overflow-hidden">
                    <label><div className="flex h-full w-full justify-center items-center text-2xl">Select image to upload</div><input type="file" name="imageFile" accept="image/*" className="hidden" onChange={handleFileChange}/></label>
                  </div>}
                <input type="text" name="imageName" placeholder="Name for image here" className="border text-3xl my-3"/>
                <Button type="submit">Upload image</Button>
              </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}