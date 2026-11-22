export default function ChatHome() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="text-5xl mb-3" aria-hidden>💬</div>
            <p className="text-2xl font-bold text-gray-800 mb-1">Your messages</p>
            <p className="text-sm text-gray-500 max-w-xs">Pick a conversation on the left, or open someone&apos;s profile and tap Message to start a new one.</p>
        </div>
    )
}
