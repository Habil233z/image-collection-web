"use client"

import { useParams } from "next/navigation"
import Conversation from "@/components/conversation"

export default function ChatWithUser() {
    const params = useParams()
    const id = Number(params?.id)

    if (!Number.isInteger(id) || id < 1) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 text-gray-500">Invalid conversation.</div>
        )
    }

    return <Conversation key={id} partnerId={id} />
}
