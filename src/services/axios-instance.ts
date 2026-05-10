import axios from "axios"
import { toast } from "sonner"

export const baseURL = import.meta.env.VITE_DEFAULT_URL

const axiosInstance = axios.create({
    baseURL,
})

export const getAccessToken = () => localStorage.getItem("token")



axiosInstance.interceptors.request.use(
    (config) => {
        const token = getAccessToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error),
)

axiosInstance.interceptors.response.use(
    (response) => response,

    async (error) => {
        const status = error.response?.status
        
        const isLoginPage = window.location.pathname === '/auth';
        if (isLoginPage && (status === 401 || status === 403)) {
            return Promise.reject(error);
        }

        if (status === 401) {
            localStorage.removeItem("token")
            window.location.href = "/auth"
            return Promise.reject(error)
        }
        if (status === 403) {
            toast.error("Sizga ruxsat berilmagan" + ": " + error?.config?.url)
        }
        return Promise.reject(error)
    },
)

export default axiosInstance
