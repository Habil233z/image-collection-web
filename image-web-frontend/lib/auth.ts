export function getStoredUsername(): string | null {
    if (typeof window === "undefined") return null
    try {
        return localStorage.getItem("username")
    } catch {
        return null
    }
}

export function isLoggedIn(): boolean {
    return !!getStoredUsername()
}

export function safeRedirectPath(path: string | null | undefined): string {
    if (path && path.startsWith("/") && !path.startsWith("//")) return path
    return "/"
}

export function loginUrl(redirectTo?: string): string {
    return redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"
}

const AVATAR_KEY = "avatar_url"

export function getStoredAvatar(): string | null {
    if (typeof window === "undefined") return null
    try {
        return localStorage.getItem(AVATAR_KEY)
    } catch {
        return null
    }
}

export function setStoredAvatar(url: string) {
    try {
        localStorage.setItem(AVATAR_KEY, url)
        window.dispatchEvent(new Event("avatar-changed"))
    } catch {}
}

export function clearSession() {
    try {
        localStorage.removeItem("username")
        localStorage.removeItem(AVATAR_KEY)
    } catch {}
}
