import axios from "axios";

const api = axios.create({
    baseURL: "https://image-collection-web.vercel.app/",
    timeout: 2000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    }
})

export default api