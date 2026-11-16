import axios from "axios";

const api = axios.create({
    baseURL: "", // Empty string means it targets http://localhost:3000/api/...
    timeout: 10000,
    withCredentials: true, // Crucial for sending/receiving cookies
    headers: {
        "Content-Type": "application/json",
    }
});

export default api;