import axios from "axios";

const api = axios.create({
    baseURL: "https://image-collection-web.vercel.app/",
    timeout: 10000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/js",
    }
})

export default api