"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SearchBox({ className = "" }: { className?: string }) {
    const router = useRouter()
    const [value, setValue] = useState("")

    function submit(e: React.FormEvent) {
        e.preventDefault()
        const q = value.trim()
        if (!q) return
        router.push(`/search?q=${encodeURIComponent(q)}`)
    }

    return (
        <form onSubmit={submit} role="search" className={className}>
            <div className="relative w-full">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/80" aria-hidden>🔍</span>
                <input
                    type="search"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Search images, #tags or people"
                    aria-label="Search"
                    className="w-full rounded-full bg-white/20 hover:bg-white/25 focus:bg-white focus:text-gray-900 text-white placeholder:text-white/80 focus:placeholder:text-gray-400 border border-white/30 pl-10 pr-4 py-2 text-sm outline-none focus:ring-4 focus:ring-white/30 transition"
                />
            </div>
        </form>
    )
}
