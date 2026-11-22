export function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function startOfDay(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function sameDay(a: string, b: string): boolean {
    return startOfDay(new Date(a)) === startOfDay(new Date(b))
}

export function formatDayLabel(iso: string): string {
    const d = new Date(iso)
    const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000)
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" })
}

export function formatListTime(iso: string): string {
    const d = new Date(iso)
    if (startOfDay(d) === startOfDay(new Date())) return formatTime(iso)
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
