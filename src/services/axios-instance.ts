import axios from "axios"
import { toast } from "sonner"
import i18n from "@/i18n/i18n"
import { getGeoHeaders, startGeoTracking } from "@/lib/geo-location"

declare module "axios" {
    interface InternalAxiosRequestConfig {
        _retried?: boolean
    }
}

const getBaseURL = () => {
    if (import.meta.env.DEV) {
        return import.meta.env.VITE_DEFAULT_URL
    }

    // Same-origin: nginx proxies /api/ to the backend, django-tenants
    // resolves the tenant from the Host header (the current subdomain).
    return `${window.location.origin}/api/v1`
}

export const baseURL = getBaseURL()

export const REQUEST_TIMEOUT = 60 * 1000

const TRANSFER_TIMEOUT = 5 * 60 * 1000

const axiosInstance = axios.create({
    baseURL,
    timeout: REQUEST_TIMEOUT,
})

export const getAccessToken = () => localStorage.getItem("token")

export const REFRESH_STORAGE_KEY = "refresh"

export const getRefreshToken = () => localStorage.getItem(REFRESH_STORAGE_KEY)

export const TENANT_STORAGE_KEY = "tenant"

export const getSelectedTenant = () => localStorage.getItem(TENANT_STORAGE_KEY)

export const TENANT_FILTER_STORAGE_KEY = "tenant_filter"

export const getTenantFilter = () =>
    (localStorage.getItem(TENANT_FILTER_STORAGE_KEY) ?? "")
        .split(",")
        .filter(Boolean)



axiosInstance.interceptors.request.use(
    (config) => {
        if (config.responseType === "blob" || config.data instanceof FormData) {
            config.timeout = Math.max(config.timeout ?? 0, TRANSFER_TIMEOUT)
        }
        const token = getAccessToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        const tenant = getSelectedTenant()
        if (token && tenant && !config.headers.has("X-Tenant")) {
            config.headers.set("X-Tenant", tenant)
        }
        const tenantFilter = getTenantFilter()
        if (
            token &&
            tenantFilter.length &&
            config.headers.get("X-Tenant") === "*"
        ) {
            config.headers.set("X-Tenant-Filter", tenantFilter.join(","))
        }
        if (token || config.url?.includes("auth/login")) {
            startGeoTracking()
        }
        Object.entries(getGeoHeaders()).forEach(([key, value]) => {
            config.headers.set(key, value)
        })
        return config
    },
    (error) => Promise.reject(error),
)

const isAuthUrl = (url?: string) =>
    !!url && /auth\/(login|refresh)/.test(url)

const getBearer = (header: unknown) =>
    typeof header === "string" ? header.replace(/^Bearer /, "") : null

// GARAJ-PERF-P-11: sessiya tugaganda login sahifasiga xabar (`expired=1`) va qaytish manzili (`redirect`) bilan o'tiladi
export const SESSION_EXPIRED_PARAM = "expired"
export const REDIRECT_PARAM = "redirect"

let loggingOut = false

const logoutToAuth = () => {
    if (loggingOut) return
    loggingOut = true
    localStorage.removeItem("token")
    localStorage.removeItem(REFRESH_STORAGE_KEY)
    localStorage.removeItem(TENANT_STORAGE_KEY)
    localStorage.removeItem(TENANT_FILTER_STORAGE_KEY)
    const { pathname, search, hash } = window.location
    const params = new URLSearchParams({ [SESSION_EXPIRED_PARAM]: "1" })
    if (pathname !== "/") params.set(REDIRECT_PARAM, `${pathname}${search}${hash}`)
    window.location.href = `/auth?${params.toString()}`
}

let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = (failedToken: string | null) => {
    const current = getAccessToken()
    if (current && failedToken && current !== failedToken) {
        return Promise.resolve(current)
    }
    const refresh = getRefreshToken()
    if (!refresh) return Promise.resolve(null)
    if (!refreshPromise) {
        refreshPromise = axios
            .post(
                `${baseURL}/auth/refresh/`,
                { refresh },
                { timeout: REQUEST_TIMEOUT },
            )
            .then(({ data }) => {
                localStorage.setItem("token", data.access)
                localStorage.setItem(REFRESH_STORAGE_KEY, data.refresh)
                return data.access as string
            })
            .catch(() => null)
            .finally(() => {
                refreshPromise = null
            })
    }
    return refreshPromise
}

axiosInstance.interceptors.response.use(
    (response) => response,

    async (error) => {
        const status = error.response?.status
        
        const isLoginPage = window.location.pathname === '/auth';
        if (isLoginPage && (status === 401 || status === 403)) {
            return Promise.reject(error);
        }

        if (status === 401) {
            const config = error.config
            if (config && !config._retried && !isAuthUrl(config.url)) {
                config._retried = true
                const token = await refreshAccessToken(
                    getBearer(config.headers?.Authorization),
                )
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`
                    return axiosInstance(config)
                }
            }
            logoutToAuth()
            return Promise.reject(error)
        }
        if (status === 403) {
            console.warn("403:", error?.config?.method, error?.config?.url)
            toast.error(i18n.t("page.forbidden_title"), {
                id: "forbidden",
                description: i18n.t("core.errors.forbidden_desc"),
            })
        }
        return Promise.reject(error)
    },
)

export default axiosInstance
