import axios from "axios";
import { clearSession, loginUrl } from "@/lib/auth";

const api = axios.create({
    baseURL: "/api-backend", // Automatically routes through the Next.js rewrite proxy
    timeout: 10000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    }
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url: string = error?.config?.url ?? "";
        if (
            typeof window !== "undefined" &&
            error?.response?.status === 401 &&
            url.replace(/^\//, "").startsWith("api/")
        ) {
            clearSession();
            const path = window.location.pathname;
            if (path !== "/login" && path !== "/register") {
                window.location.href = loginUrl(path + window.location.search);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
