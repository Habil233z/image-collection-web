import axios from "axios";

const api = axios.create({
    baseURL: "/api-backend", // Automatically routes through the Next.js rewrite proxy
    timeout: 10000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    }
});

export default api;