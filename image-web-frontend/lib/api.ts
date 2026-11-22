import axios from "axios";
import { loginUrl } from "@/lib/auth";

const api = axios.create({
    baseURL: "/api-backend", // Automatically routes through the Next.js rewrite proxy
    timeout: 10000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    }
});

// Protected endpoints all live under "api/...". If one answers 401 the visitor is
// not logged in (or the session expired): forget the stale username and send
// them to the login page, then bring them back afterwards.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url: string = error?.config?.url ?? "";
        if (
            typeof window !== "undefined" &&
            error?.response?.status === 401 &&
            url.replace(/^\//, "").startsWith("api/")
        ) {
            try {
                localStorage.removeItem("username");
            } catch {}
            const path = window.location.pathname;
            if (path !== "/login" && path !== "/register") {
                window.location.href = loginUrl(path + window.location.search);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
