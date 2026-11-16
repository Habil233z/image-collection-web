import axios from "axios";

const api = axios.create({
    baseURL: "https://image-collection-web.vercel.app/",
    timeout: 5000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    }
})

export default api