import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"
import { toast } from "sonner"

const getBaseURL = () => {
    if (import.meta.env.DEV) {
        return import.meta.env.VITE_DEFAULT_URL
    }

    // Same-origin: nginx proxies /api/ to the backend, django-tenants
    // resolves the tenant from the Host header (the current subdomain).
    return `${window.location.origin}/api/v1`
}

export const baseURL = getBaseURL()

/**
 * So'rovning eng uzun kutish muddati.
 *
 * NEGA MAJBURIY: axios'da sukut bo'yicha timeout YO'Q (`0` — cheksiz). Server
 * ulanishni qabul qilib, keyin javob bermay qo'ysa (o'chib qolgan, osilgan,
 * tarmoq o'rtada uzilgan) so'rov CHEKSIZ osilib turadi — na natija, na xato.
 * react-query esa uni abadiy `pending` deb ushlab turadi, `isError` hech qachon
 * yonmaydi va sahifa `data ?? 0` yozgan joyda foydalanuvchiga **0** ko'rsatadi.
 *
 * Timeout shu zanjirni uzadi: kutish tugagach axios halol xato beradi va
 * ilovaning butun xato qatlami (DataError, ServerStatusBanner) ishlab ketadi.
 *
 * 20 soniya — oddiy JSON ro'yxat uchun juda mo'l; undan uzoq cho'zilgan so'rov
 * allaqachon nosozlik. Uzoqroq kerak bo'lgan joy (masalan Excel eksporti)
 * o'z `timeout` ini config orqali beradi va bu qiymatni bekor qiladi.
 */
export const REQUEST_TIMEOUT_MS = 20_000

const axiosInstance = axios.create({
    baseURL,
    timeout: REQUEST_TIMEOUT_MS,
})

/** Kutish muddati tugagan (server javob bermagan) xatosimi? */
export const isTimeoutError = (error: unknown) => {
    const code = (error as { code?: string })?.code
    return code === "ECONNABORTED" || code === "ETIMEDOUT"
}

/* ------------------------------------------------------------------ *
 *  Token saqlash
 *
 *  Access token muddati QISQA (15 daqiqa), refresh token 7 kun va u
 *  rotatsiya qilinadi (har refresh'da yangi refresh qaytadi, eskisi
 *  blacklist'ga tushadi). Shuning uchun ikkala token ham saqlanishi va
 *  refresh javobida kelgan YANGI refresh eskisining o'rniga yozilishi shart —
 *  aks holda foydalanuvchi 15 daqiqada tizimdan chiqib ketadi.
 * ------------------------------------------------------------------ */

export const ACCESS_TOKEN_KEY = "token"
export const REFRESH_TOKEN_KEY = "refresh_token"

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)

export const setTokens = (tokens: { access?: string; refresh?: string }) => {
    if (tokens.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)
    }
    // Rotatsiya: server yangi refresh qaytarsa, eskisi allaqachon bekor qilingan.
    if (tokens.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
    }
}

export const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
}

const AUTH_PAGE = "/auth"
const REFRESH_PATH = "/auth/refresh/"
const LOGOUT_PATH = "/auth/logout/"

const isAuthEndpoint = (url?: string) =>
    !!url && (url.includes("/auth/refresh/") || url.includes("/auth/login/"))

const redirectToLogin = () => {
    clearTokens()
    if (window.location.pathname !== AUTH_PAGE) {
        window.location.href = AUTH_PAGE
    }
}

/**
 * Refresh so'rovi UMUMIY interceptor'dan tashqarida, toza axios bilan yuboriladi —
 * shunda refresh'ning o'zi 401 bersa qayta refresh qilishga urinib cheksiz
 * halqaga tushib qolmaydi.
 */
const refreshClient = axios.create({ baseURL, timeout: REQUEST_TIMEOUT_MS })

/**
 * Bir vaqtda bir nechta so'rov 401 olsa, refresh FAQAT BIR MARTA yuboriladi;
 * qolganlari o'sha bitta va'daning natijasini kutadi.
 */
let refreshPromise: Promise<string> | null = null

const refreshAccessToken = (): Promise<string> => {
    if (refreshPromise) return refreshPromise

    const refresh = getRefreshToken()
    if (!refresh) {
        return Promise.reject(new Error("Refresh token yo'q"))
    }

    refreshPromise = refreshClient
        .post(REFRESH_PATH, { refresh })
        .then((res) => {
            const access: string | undefined = res.data?.access
            if (!access) {
                throw new Error("Refresh javobida access token yo'q")
            }
            setTokens({ access, refresh: res.data?.refresh })
            return access
        })
        .finally(() => {
            refreshPromise = null
        })

    return refreshPromise
}

/** Chiqish: refresh tokenni serverda bekor qilib, keyin lokal tozalash. */
export const logoutRequest = async () => {
    const refresh = getRefreshToken()
    if (refresh) {
        try {
            await refreshClient.post(
                LOGOUT_PATH,
                { refresh },
                { headers: { Authorization: `Bearer ${getAccessToken()}` } },
            )
        } catch {
            // Server bekor qila olmasa ham lokal sessiya baribir tozalanadi.
        }
    }
    clearTokens()
}

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

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

axiosInstance.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
        const status = error.response?.status
        const config = error.config as RetriableConfig | undefined

        const isLoginPage = window.location.pathname === AUTH_PAGE
        if (isLoginPage && (status === 401 || status === 403)) {
            return Promise.reject(error)
        }

        if (status === 401) {
            // Login/refresh so'rovining o'zi 401 bersa — qayta urinmaymiz.
            // Har bir so'rov uchun ATIGI BITTA qayta urinish (`_retried`).
            if (!config || config._retried || isAuthEndpoint(config.url)) {
                redirectToLogin()
                return Promise.reject(error)
            }

            try {
                const access = await refreshAccessToken()
                config._retried = true
                config.headers.Authorization = `Bearer ${access}`
                return axiosInstance(config)
            } catch {
                redirectToLogin()
                return Promise.reject(error)
            }
        }

        if (status === 403) {
            toast.error("Sizga ruxsat berilmagan" + ": " + error?.config?.url)
        }
        return Promise.reject(error)
    },
)

export default axiosInstance
