"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react";
import Header from "@/components/header";
import ImageCropper from "@/components/image-cropper";
import api from "@/lib/api";
import { setStoredAvatar } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function EditProfile() {
    const [username, setUsername] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [avatarUrl, setAvatarUrl] = useState<string>("");
    const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
    const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
    const [removeAvatar, setRemoveAvatar] = useState<boolean>(false);
    const [cropSource, setCropSource] = useState<{ url: string; name: string; type: string } | null>(null);
    const [saving, setSaving] = useState<boolean>(false);

    const router = useRouter()

    async function getProfile() {
        try {
            const response = await api.get("api/profile")
            setUsername(response.data.data.username)
            localStorage.setItem("username", response.data.data.username)
            setEmail(response.data.data.email)
            setAvatarUrl(response.data.data.avatar_url || "")
        } catch (err) {
            console.log(err)
        }
    }

    function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return
        if (!file.type.startsWith("image/")) {
            alert("Please choose an image file")
            return
        }
        setCropSource({ url: URL.createObjectURL(file), name: file.name, type: file.type })
    }

    function closeCropper() {
        if (cropSource) URL.revokeObjectURL(cropSource.url)
        setCropSource(null)
    }

    function handleAvatarApplied(file: File) {
        setNewAvatarFile(file)
        setRemoveAvatar(false)
        setNewAvatarPreview((old) => {
            if (old) URL.revokeObjectURL(old)
            return URL.createObjectURL(file)
        })
        closeCropper()
    }

    function handleRemoveAvatar() {
        setNewAvatarFile(null)
        setNewAvatarPreview((old) => {
            if (old) URL.revokeObjectURL(old)
            return null
        })
        setRemoveAvatar(true)
    }

    function handleUndoAvatar() {
        setNewAvatarFile(null)
        setNewAvatarPreview((old) => {
            if (old) URL.revokeObjectURL(old)
            return null
        })
        setRemoveAvatar(false)
    }

    async function handleEditProfile(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const newProfileData = new FormData(e.currentTarget)
        if (newAvatarFile) {
            newProfileData.append("avatarFile", newAvatarFile)
        } else if (removeAvatar) {
            newProfileData.append("removeAvatar", "true")
        }

        setSaving(true)
        try {
            const response = await api.patch("api/profile", newProfileData, { headers: { "Content-Type": undefined } })
            const savedAvatar: string = response.data?.avatar_url ?? avatarUrl
            localStorage.setItem("username", username)
            setStoredAvatar(savedAvatar)
            router.push(`/profile`)
        } catch (error: any) {
            console.log(error)
            alert(error.response?.data?.error || "Failed to update profile")
            setSaving(false)
        }
    }

    useEffect(() => {
        getProfile()
    }, []);

    const shownAvatar = newAvatarPreview || (removeAvatar ? "" : avatarUrl)
    const hasAvatar = !!(newAvatarPreview || (!removeAvatar && avatarUrl))
    const avatarChanged = !!newAvatarFile || removeAvatar

    return (
        <div className="page-bg min-h-screen w-full flex flex-col">
            <Header username={username} />

            <main className="flex-1 px-4 sm:px-6 py-8 flex justify-center items-start pt-6">
                <Card className={`w-full ${cropSource ? "max-w-xl" : "max-w-md"} glass-card rounded-3xl tile-in p-6 sm:p-8 flex flex-col items-center`}>
                    {cropSource ? (
                        <>
                            <CardHeader className="pb-4 text-center">
                                <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">Crop your avatar</CardTitle>
                            </CardHeader>
                            <CardContent className="w-full">
                                <ImageCropper
                                    src={cropSource.url}
                                    fileName={cropSource.name}
                                    mimeType={cropSource.type}
                                    fixedAspect={1}
                                    maxOutputSide={512}
                                    round
                                    applyLabel="Use as avatar"
                                    onApply={handleAvatarApplied}
                                    onCancel={closeCropper}
                                />
                            </CardContent>
                        </>
                    ) : (
                        <>
                            <CardHeader className="flex flex-col justify-center items-center pb-4 text-center">
                                <div className="relative mb-3">
                                    <div className="h-32 w-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-xl relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            className={`h-full w-full object-cover transition ${saving && avatarChanged ? "opacity-60 blur-[1px]" : ""}`}
                                            src={shownAvatar || "/user.png"}
                                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/user.png"; }}
                                            alt="Profile Avatar"
                                        />
                                        {/* ghost state while the new avatar is being uploaded */}
                                        {saving && avatarChanged && (
                                            <>
                                                <div className="shimmer absolute inset-0" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="h-8 w-8 rounded-full border-[3px] border-white/50 border-t-white animate-spin" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {avatarChanged && !saving && (
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow">
                                            {removeAvatar ? "Will be removed" : "New — save to apply"}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap justify-center gap-2 mt-2">
                                    <label className={`inline-flex items-center cursor-pointer rounded-full border border-gray-300 bg-white/70 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-white transition ${saving ? "pointer-events-none opacity-50" : ""}`}>
                                        {hasAvatar ? "Change avatar" : "Upload avatar"}
                                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} disabled={saving} />
                                    </label>
                                    {hasAvatar && (
                                        <Button type="button" variant="outline" disabled={saving} onClick={handleRemoveAvatar} className="rounded-full px-4 border-red-200 text-red-600 hover:bg-red-50">
                                            Remove
                                        </Button>
                                    )}
                                    {avatarChanged && (
                                        <Button type="button" variant="outline" disabled={saving} onClick={handleUndoAvatar} className="rounded-full px-4 text-gray-600">
                                            Undo
                                        </Button>
                                    )}
                                </div>

                                <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 mt-5">Edit Profile</CardTitle>
                            </CardHeader>

                            <CardContent className="w-full">
                                <form onSubmit={handleEditProfile} className="flex flex-col gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Email</label>
                                        <input
                                            className="field text-sm sm:text-base"
                                            type="email"
                                            name="email"
                                            placeholder="Email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Username</label>
                                        <input
                                            className="field text-sm sm:text-base"
                                            type="text"
                                            name="username"
                                            placeholder="Username"
                                            minLength={5}
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>

                                    <Button type="submit" disabled={saving} className="w-full bg-neutral-900 hover:bg-black text-white font-medium py-3 rounded-full transition shadow-lg text-base mt-2 disabled:opacity-60">
                                        {saving ? "Saving..." : "Save Changes"}
                                    </Button>
                                </form>
                            </CardContent>
                        </>
                    )}
                </Card>
            </main>
        </div>
    );
}
