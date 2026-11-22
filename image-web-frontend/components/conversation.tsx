"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Avatar from "@/components/avatar"
import { useChat } from "@/components/chat-shell"
import api from "@/lib/api"
import { formatDayLabel, formatTime, sameDay } from "@/lib/chat-time"

interface Message {
    id: number
    sender_id: number
    body: string
    created_at: string
    edited_at: string | null
    mine: boolean
    read: boolean
    pending?: boolean
}

interface Partner {
    id: number
    username: string
    avatar_url: string
}

const POLL_MS = 3000
const MAX_LEN = 2000

function signature(list: Message[]): string {
    return list.map((m) => `${m.id}:${m.edited_at ?? ""}:${m.read ? 1 : 0}`).join("|")
}

export default function Conversation({ partnerId }: { partnerId: number }) {
    const { refreshConversations } = useChat()

    const [partner, setPartner] = useState<Partner | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<"notfound" | "failed" | null>(null)
    const [text, setText] = useState("")
    const [sendError, setSendError] = useState<string | null>(null)

    const [editingId, setEditingId] = useState<number | null>(null)
    const [editText, setEditText] = useState("")

    const scrollRef = useRef<HTMLDivElement>(null)
    const composerRef = useRef<HTMLTextAreaElement>(null)
    const stickToBottom = useRef(true)
    const lastSig = useRef("")
    const fetchSeq = useRef(0)
    const mutating = useRef(0)
    const messagesRef = useRef<Message[]>([])
    messagesRef.current = messages

    const fetchMessages = useCallback(async (force = false) => {
        const seq = ++fetchSeq.current
        try {
            const res = await api.get(`api/chats/${partnerId}/messages`)
            if (seq !== fetchSeq.current) return
            if (mutating.current > 0 && !force) return

            const incoming: Message[] = res.data.data || []
            setPartner(res.data.partner)
            setLoadError(null)
            const sig = signature(incoming)
            if (sig !== lastSig.current || messagesRef.current.some((m) => m.pending)) {
                lastSig.current = sig
                setMessages(incoming)
            }
        } catch (err: any) {
            if (seq !== fetchSeq.current) return
            const status = err?.response?.status
            if (status === 404 || status === 400) setLoadError("notfound")
            else if (messagesRef.current.length === 0) setLoadError("failed")
        } finally {
            setLoading(false)
        }
    }, [partnerId])

    useEffect(() => {
        fetchMessages()
        const timer = setInterval(() => {
            if (document.visibilityState === "visible") fetchMessages()
        }, POLL_MS)
        const onVisible = () => {
            if (document.visibilityState === "visible") fetchMessages()
        }
        document.addEventListener("visibilitychange", onVisible)
        return () => {
            clearInterval(timer)
            document.removeEventListener("visibilitychange", onVisible)
        }
    }, [fetchMessages])

    useLayoutEffect(() => {
        const el = scrollRef.current
        if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
    }, [messages, partner])

    useEffect(() => {
        if (text === "" && composerRef.current) composerRef.current.style.height = "auto"
    }, [text])

    function onScroll() {
        const el = scrollRef.current
        if (!el) return
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    }

    async function sendMessage() {
        const body = text.trim()
        if (!body) return

        const tempId = -Date.now()
        const optimistic: Message = {
            id: tempId,
            sender_id: -1,
            body,
            created_at: new Date().toISOString(),
            edited_at: null,
            mine: true,
            read: false,
            pending: true,
        }
        stickToBottom.current = true
        setMessages((prev) => [...prev, optimistic])
        setText("")
        setSendError(null)

        mutating.current++
        try {
            await api.post(`api/chats/${partnerId}/messages`, { body })
            await fetchMessages(true)
            refreshConversations()
        } catch (err: any) {
            console.error("Failed to send message:", err)
            setMessages((prev) => prev.filter((m) => m.id !== tempId))
            setText(body)
            setSendError(err?.response?.data?.error || "Message not sent. Please try again.")
        } finally {
            mutating.current--
        }
    }

    function startEdit(m: Message) {
        setEditingId(m.id)
        setEditText(m.body)
    }

    async function saveEdit(m: Message) {
        const body = editText.trim()
        if (!body) return
        if (body === m.body) {
            setEditingId(null)
            return
        }

        const previous = messagesRef.current
        setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, body, edited_at: new Date().toISOString() } : x)))
        setEditingId(null)

        mutating.current++
        try {
            await api.patch(`api/messages/${m.id}`, { body })
            await fetchMessages(true)
            refreshConversations()
        } catch (err: any) {
            console.error("Failed to edit message:", err)
            setMessages(previous)
            alert(err?.response?.data?.error || "Failed to edit message.")
        } finally {
            mutating.current--
        }
    }

    async function deleteMessage(m: Message) {
        if (!window.confirm("Delete this message? It will be removed for both of you.")) return

        const previous = messagesRef.current
        setMessages((prev) => prev.filter((x) => x.id !== m.id))

        mutating.current++
        try {
            await api.delete(`api/messages/${m.id}`)
            await fetchMessages(true)
            refreshConversations()
        } catch (err: any) {
            if (err?.response?.status === 404) {
                refreshConversations()
            } else {
                console.error("Failed to delete message:", err)
                setMessages(previous)
                alert(err?.response?.data?.error || "Failed to delete message.")
            }
        } finally {
            mutating.current--
        }
    }

    if (loadError === "notfound") {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <p className="text-2xl font-bold text-gray-800 mb-1">Conversation not available</p>
                <p className="text-sm text-gray-500 mb-4">This user doesn&apos;t exist, or it&apos;s your own account.</p>
                <Link href="/chat" className="bg-neutral-900 hover:bg-black text-white font-medium px-6 py-2.5 rounded-full shadow-md transition">Back to messages</Link>
            </div>
        )
    }

    const lastMineIndex = (() => {
        for (let i = messages.length - 1; i >= 0; i--) if (messages[i].mine) return i
        return -1
    })()

    return (
        <>
            <div className="flex items-center gap-3 px-3 sm:px-5 py-3 border-b border-gray-200/70 bg-white/40">
                <Link href="/chat" className="md:hidden h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-gray-700 hover:bg-white/70 text-xl" aria-label="Back to conversations">
                    ←
                </Link>
                {partner ? (
                    <Link href={`/user/${partner.id}`} className="flex items-center gap-3 min-w-0 group">
                        <Avatar src={partner.avatar_url} alt={partner.username} className="h-10 w-10" />
                        <span className="font-bold text-gray-900 truncate group-hover:text-sky-600 transition">{partner.username}</span>
                    </Link>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="skeleton h-10 w-10 rounded-full" />
                        <div className="skeleton h-4 w-28 rounded" />
                    </div>
                )}
            </div>

            {/* messages */}
            <div ref={scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-4 flex flex-col gap-1.5">
                {loading && (
                    <div className="flex flex-col gap-3" aria-busy="true">
                        {[60, 40, 70, 45].map((w, i) => (
                            <div key={i} className={`skeleton h-10 rounded-2xl ${i % 2 ? "self-end" : "self-start"}`} style={{ width: `${w}%` }} />
                        ))}
                    </div>
                )}

                {!loading && loadError === "failed" && messages.length === 0 && (
                    <p className="m-auto text-sm text-gray-500">Couldn&apos;t load messages. Retrying…</p>
                )}

                {!loading && !loadError && messages.length === 0 && (
                    <p className="m-auto text-sm text-gray-500 text-center">No messages yet. Say hi to {partner?.username}!</p>
                )}

                {messages.map((m, i) => {
                    const showDay = i === 0 || !sameDay(messages[i - 1].created_at, m.created_at)
                    const editing = editingId === m.id
                    return (
                        <div key={m.id} className="flex flex-col">
                            {showDay && (
                                <div className="self-center my-3 text-xs font-semibold text-gray-500 bg-white/70 rounded-full px-3 py-1 shadow-xs">
                                    {formatDayLabel(m.created_at)}
                                </div>
                            )}

                            <div className={`group flex items-end gap-1.5 ${m.mine ? "flex-row-reverse" : ""}`}>
                                <div className={`max-w-[80%] sm:max-w-[70%] flex flex-col ${m.mine ? "items-end" : "items-start"}`}>
                                    {editing ? (
                                        <div className="w-full min-w-60 sm:min-w-80 bg-white rounded-2xl border border-sky-300 p-2 shadow-md flex flex-col gap-2">
                                            <textarea
                                                autoFocus
                                                value={editText}
                                                maxLength={MAX_LEN}
                                                rows={2}
                                                onChange={(e) => setEditText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                                                        e.preventDefault()
                                                        saveEdit(m)
                                                    } else if (e.key === "Escape") {
                                                        setEditingId(null)
                                                    }
                                                }}
                                                className="w-full resize-none text-black text-sm sm:text-base px-2 py-1 focus:outline-none"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" onClick={() => setEditingId(null)} className="rounded-full px-4 h-8 border-gray-300">Cancel</Button>
                                                <Button onClick={() => saveEdit(m)} disabled={!editText.trim()} className="bg-neutral-900 hover:bg-black text-white rounded-full px-4 h-8">Save</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={`px-4 py-2 rounded-2xl whitespace-pre-wrap wrap-break-word text-sm sm:text-base shadow-sm ${m.mine ? "bg-sky-500 text-white rounded-br-md" : "bg-white text-gray-800 rounded-bl-md"} ${m.pending ? "opacity-60" : ""}`}
                                        >
                                            {m.body}
                                        </div>
                                    )}

                                    <p className="text-[11px] text-gray-400 mt-0.5 px-1">
                                        {m.pending ? "Sending…" : formatTime(m.created_at)}
                                        {m.edited_at && !m.pending ? " · edited" : ""}
                                        {m.mine && !m.pending && i === lastMineIndex && m.read ? " · Seen" : ""}
                                    </p>
                                </div>

                                {m.mine && !m.pending && !editing && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="focus:outline-none self-center">
                                            <div
                                                aria-label="Message options"
                                                className="font-bold text-base cursor-pointer w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-white/80 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-has-[[data-popup-open]]:opacity-100 transition"
                                            >
                                                ⋮
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-32 rounded-2xl p-1 shadow-xl bg-white/95 backdrop-blur-md border border-white/80">
                                            <DropdownMenuGroup>
                                                <DropdownMenuItem onClick={() => startEdit(m)} className="cursor-pointer font-medium rounded-xl px-3 py-1.5 focus:bg-sky-50 focus:text-sky-600 transition">
                                                    Edit
                                                </DropdownMenuItem>
                                            </DropdownMenuGroup>
                                            <DropdownMenuSeparator className="my-1 border-gray-100" />
                                            <DropdownMenuGroup>
                                                <DropdownMenuItem onClick={() => deleteMessage(m)} className="cursor-pointer text-red-600 font-medium rounded-xl px-3 py-1.5 focus:bg-red-50 focus:text-red-700 transition">
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* composer */}
            <div className="border-t border-gray-200/70 bg-white/50 px-3 sm:px-5 py-3">
                {sendError && <p className="text-sm text-red-600 mb-2">{sendError}</p>}
                <div className="flex items-end gap-2">
                    <textarea
                        ref={composerRef}
                        value={text}
                        maxLength={MAX_LEN}
                        rows={1}
                        placeholder="Write a message…"
                        onChange={(e) => {
                            setText(e.target.value)
                            e.currentTarget.style.height = "auto"
                            e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 140)}px`
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                                e.preventDefault()
                                sendMessage()
                            }
                        }}
                        className="field flex-1 resize-none max-h-35 py-2.5! rounded-2xl!"
                    />
                    <Button
                        onClick={sendMessage}
                        disabled={!text.trim()}
                        className="bg-neutral-900 hover:bg-black text-white font-medium px-6 h-11 rounded-full shadow-lg"
                    >
                        Send
                    </Button>
                </div>
            </div>
        </>
    )
}
