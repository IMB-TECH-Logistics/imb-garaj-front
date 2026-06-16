import axios from "axios"
import { toast } from "sonner"

const getBaseURL = () => {
    if (import.meta.env.VITE_DEFAULT_URL) {
        return import.meta.env.VITE_DEFAULT_URL
    }
    // Same-origin: nginx proxies /api/ to the backend, django-tenants
    // resolves the tenant from the Host header (the current subdomain).
    return `${window.location.origin}/api/v1`
}

export const baseURL = getBaseURL()

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
