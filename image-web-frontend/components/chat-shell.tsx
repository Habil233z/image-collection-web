"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"
import Header from "@/components/header"
import Avatar from "@/components/avatar"
import api from "@/lib/api"
import { getStoredUsername, loginUrl } from "@/lib/auth"
import { formatListTime } from "@/lib/chat-time"

export interface ConversationItem {
    partner: { id: number; username: string; avatar_url: string }
    last_message: string
    last_mine: boolean
    last_at: string
    unread: number
}

const LIST_POLL_MS = 5000

const ChatContext = createContext<{ refreshConversations: () => void }>({ refreshConversations: () => {} })
export const useChat = () => useContext(ChatContext)

export default function ChatShell({ children }: { children: React.ReactNode }) {
    const segment = useSelectedLayoutSegment()
    const activeId = segment ? Number(segment) : null

    const [username, setUsername] = useState<string | null>(null)
    const [ready, setReady] = useState(false)
    const [conversations, setConversations] = useState<ConversationItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const refreshConversations = useCallback(async () => {
        try {
            const res = await api.get("api/chats")
            setConversations(res.data.data || [])
            setError(false)
        } catch (err) {
            console.error("Failed to load conversations:", err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const stored = getStoredUsername()
        setUsername(stored)
        if (!stored) {
            window.location.href = loginUrl(window.location.pathname)
            return
        }
        setReady(true)
    }, [])

    useEffect(() => {
        if (!ready) return
        refreshConversations()
        const timer = setInterval(() => {
            if (document.visibilityState === "visible") refreshConversations()
        }, LIST_POLL_MS)
        return () => clearInterval(timer)
    }, [ready, refreshConversations])

    const ctx = useMemo(() => ({ refreshConversations }), [refreshConversations])

    return (
        <ChatContext.Provider value={ctx}>
            <div className="page-bg h-dvh w-full flex flex-col">
                <Header username={username} />

                <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-0 sm:px-6 sm:py-4 flex">
                    <div className="glass-card sm:rounded-3xl flex-1 min-h-0 flex overflow-hidden">
                        <aside className={`${activeId ? "hidden md:flex" : "flex"} w-full md:w-80 md:shrink-0 md:border-r border-gray-200/70 flex-col min-h-0`}>
                            <div className="px-5 py-4 border-b border-gray-200/70">
                                <h2 className="text-xl font-extrabold text-gray-900">Messages</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {loading && (
                                    <div className="p-3 flex flex-col gap-2" aria-busy="true">
                                        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton rounded-2xl h-16" />)}
                                    </div>
                                )}

                                {!loading && error && conversations.length === 0 && (
                                    <p className="p-6 text-center text-sm text-gray-500">Couldn&apos;t load your conversations.</p>
                                )}

                                {!loading && !error && conversations.length === 0 && (
                                    <div className="p-6 text-center">
                                        <p className="font-semibold text-gray-800 mb-1">No conversations yet</p>
                                        <p className="text-sm text-gray-500">Open someone&apos;s profile and tap <span className="font-semibold">Message</span> to say hi.</p>
                                    </div>
                                )}

                                {conversations.map((cv) => {
                                    const active = cv.partner.id === activeId
                                    const unread = active ? 0 : cv.unread
                                    return (
                                        <Link
                                            key={cv.partner.id}
                                            href={`/chat/${cv.partner.id}`}
                                            className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100/70 transition ${active ? "bg-sky-100/70" : "hover:bg-white/60"}`}
                                        >
                                            <Avatar src={cv.partner.avatar_url} alt={cv.partner.username} className="h-12 w-12" />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <span className={`truncate ${unread ? "font-extrabold text-gray-900" : "font-semibold text-gray-800"}`}>{cv.partner.username}</span>
                                                    <span className="text-xs text-gray-400 shrink-0">{formatListTime(cv.last_at)}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`truncate text-sm ${unread ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                                                        {cv.last_mine ? "You: " : ""}{cv.last_message}
                                                    </p>
                                                    {unread > 0 && (
                                                        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">
                                                            {unread > 99 ? "99+" : unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </aside>

                        <section className={`${activeId ? "flex" : "hidden md:flex"} flex-1 min-w-0 min-h-0 flex-col`}>
                            {ready ? children : null}
                        </section>
                    </div>
                </main>
            </div>
        </ChatContext.Provider>
    )
}
