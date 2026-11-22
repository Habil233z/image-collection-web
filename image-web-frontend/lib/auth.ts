// Client-side helpers for "is somebody logged in?".
// The real session lives in an HttpOnly cookie that only the backend can read;
// the username in localStorage is just a UI hint. The backend remains the
// source of truth: every protected endpoint still answers 401 without a valid cookie.

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

/** Only allow same-site relative paths as post-login redirect targets. */
export function safeRedirectPath(path: string | null | undefined): string {
    if (path && path.startsWith("/") && !path.startsWith("//")) return path
    return "/"
}

export function loginUrl(redirectTo?: string): string {
    return redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"
}
