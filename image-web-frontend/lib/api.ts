import axios from "axios";

const api = axios.create({
    baseURL: "", // Empty string routes through the Next.js local proxy rewrite
    timeout: 5000,
    withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
    headers: {
        "Content-Type": "application/json",
    }
});

export default api