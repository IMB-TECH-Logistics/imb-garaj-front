import axiosInstance, { isTimeoutError } from "@/services/axios-instance"
import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import { AxiosRequestConfig } from "axios"
import * as React from "react"

const DEFAULT_STALE_TIME = 1000 * 5 * 60

/**
 * "Muzlab qolgan" so'rov qancha kutilgach xato deb e'lon qilinadi.
 *
 * Nol emas: birinchi render'da react-query bir zumga `fetchStatus: "idle"`
 * ko'rsatib ulgurishi mumkin, va bu qisqa oniy holat uchun butun sahifaga
 * xato chizish — yangi nuqson bo'lardi. 1.5 soniya odam sezmaydigan, lekin
 * har qanday normal boshlanishga yetadigan muddat.
 */
const STALL_GRACE_MS = 1500

export const buildQueryKey = (url: string, params?: Record<string, any>) => {
    const paramValues = Object.values(params || {}).filter(
        (v) => v !== undefined && v !== null && v !== "",
    )
    return paramValues.length > 0 ? [url, ...paramValues] : [url]
}

export type UseGetArgs<TData = any, TQueryFnData = unknown, TError = any> = {
    options?: Partial<UseQueryOptions<TQueryFnData, TError, TData>>
    config?: Omit<AxiosRequestConfig, "params">
    params?: Record<string, unknown>
    enabled?: boolean
}

/**
 * Qayta urinish siyosati.
 *
 * 4xx javob (404, 403, 400...) qayta so'ralganda ham o'zgarmaydi — uni qayta
 * urinib ko'rish foydasiz. Bundan ham yomoni: react-query `networkMode: "online"`
 * bilan qayta urinishlar orasida so'rovni "paused" holatiga qo'yishi mumkin, va
 * o'shanda `status` "pending" bo'lib qoladi — ya'ni `isError` HECH QACHON
 * yoqilmaydi va sahifa foydalanuvchiga sababsiz bo'sh ekran ko'rsatadi
 * (aynan shu /trip sahifasida 404 ning "jimgina yutilishiga" olib kelgan).
 *
 * Shuning uchun: 4xx — darhol xato; 5xx va tarmoq uzilishi — 2 marta qayta urinish.
 *
 * Kutish muddati tugashi (timeout) alohida: har urinish 20 soniya kutadi,
 * shuning uchun uch marta urinish foydalanuvchini bir daqiqa noaniqlikda
 * ushlab turardi. Bunday so'rovga ATIGI BITTA qayta urinish beriladi.
 */
const retryPolicy = (failureCount: number, error: unknown) => {
    const status = (error as { response?: { status?: number } })?.response
        ?.status
    if (typeof status === "number" && status >= 400 && status < 500) {
        return false
    }
    if (isTimeoutError(error)) {
        return failureCount < 1
    }
    return failureCount < 2
}

export const getRequest = (url: string, config?: AxiosRequestConfig) =>
    axiosInstance.get(`/${url}/`, config).then((res) => res.data)

/**
 * So'rov "muzlab qolgan" xatosi.
 *
 * `response` maydoni ataylab yo'q — `data-error.tsx` va `server-status-banner.tsx`
 * javobsiz so'rovni aynan shu belgidan taniydi va "Serverga ulanib bo'lmadi"
 * deb tushuntiradi.
 */
export class StalledQueryError extends Error {
    readonly isStalledQuery = true
    constructor(url: string) {
        super(`So'rov javobsiz qoldi: ${url}`)
        this.name = "StalledQueryError"
    }
}

/**
 * `useGet` — ilovadagi BARCHA o'qish so'rovlarining yagona darvozasi.
 *
 * ┌─ NEGA BU YERDA QO'SHIMCHA HOLAT BOR ────────────────────────────────────┐
 *
 * react-query so'rovni uch holatda ko'rsatadi: `pending` / `success` / `error`.
 * Muammo shundaki, "server javob bermadi" ularning HECH BIRIGA tushmaydi:
 *
 *   • server HTTP xato qaytarsa (404/403/500) → `isError` yonadi ✅
 *   • server UMUMAN javob bermasa (o'chgan, aloqa uzilgan) → so'rov
 *     `status: "pending"` + `fetchStatus: "idle"` (yoki `"paused"`) holatida
 *     MUZLAB qoladi: `isError` — `false`, `data` — `undefined`.
 *
 * Oqibati butun ilova bo'ylab bir xil: `data ?? 0` yozgan har qanday joy eng
 * yomon paytda — server o'chganda — foydalanuvchiga ishonchli ko'rinadigan
 * **0** chizadi. Ombor "0 so'm balans", Haydovchilar "0 ta" deydi. Bu yolg'on:
 * "ma'lumot yo'q" bilan "so'rov umuman ishlamadi" bir xil narsa emas.
 *
 * Shuning uchun muzlash shu yerda, bitta joyda, XATO sifatida e'lon qilinadi —
 * chaqiruvchi sahifa bir harf ham o'zgartirmasa ham to'g'ri ishlaydi.
 *
 * ⚠ ENG MUHIM SHART — teskarisi buzilmasin:
 * HAQIQATAN bo'sh natija (HTTP 200 + `count: 0`) xato EMAS. U `status:
 * "success"` bilan keladi, `data` esa mavjud (`{count: 0, results: []}`),
 * shuning uchun quyidagi shart unga hech qachon tegmaydi va sahifa avvalgidek
 * "Ma'lumot topilmadi" ko'rsatadi. Ikkalasini ajratuvchi chegara — `data`ning
 * bor-yo'qligi, uning ichidagi son emas.
 *
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export const useGet = <TData = any, TQueryFnData = unknown, TError = any>(
    url: string,
    args?: UseGetArgs<TData, TQueryFnData, TError>,
) => {
    const { config, options, params, enabled = true } = args || {}
    const queryKey = buildQueryKey(url, params)

    const query = useQuery<TQueryFnData, TError, TData>({
        queryKey,
        queryFn: () => getRequest(url, { ...config, params }),
        staleTime: options?.staleTime ?? DEFAULT_STALE_TIME,
        retry: retryPolicy,
        /**
         * Aloqa uzilganda react-query so'rovni sukut bo'yicha "paused" qilib
         * qo'yadi — xato ham bermaydi, natija ham bermaydi, ya'ni AYNAN
         * yuqorida tasvirlangan muzlash. "always" bilan so'rov baribir
         * yuboriladi va yiqilsa halol `error` beradi.
         */
        networkMode: "always",
        enabled,
        ...options,
    })

    /**
     * So'rov yoqilganmi? `enabled` ikki joydan berilishi mumkin — to'g'ridan-
     * to'g'ri va `options` ichidan; `options` ustun (u `useQuery` ga oxirgi
     * bo'lib tushadi). O'chirilgan so'rov ham `pending` + `idle` bo'ladi,
     * lekin bu MUZLASH emas — ataylab kutish, shuning uchun farqlanishi shart.
     */
    const resolvedEnabled =
        typeof options?.enabled === "boolean" ? options.enabled : enabled

    /**
     * Muzlash belgisi: so'rov yoqilgan, natija ham, xato ham yo'q, va hech
     * qanday harakat ham ketmayapti (`idle`/`paused`).
     */
    const looksStalled =
        resolvedEnabled &&
        query.status === "pending" &&
        query.data === undefined &&
        (query.fetchStatus === "idle" || query.fetchStatus === "paused")

    const [isStalled, setIsStalled] = React.useState(false)

    React.useEffect(() => {
        if (!looksStalled) {
            setIsStalled(false)
            return
        }
        const timer = setTimeout(() => setIsStalled(true), STALL_GRACE_MS)
        return () => clearTimeout(timer)
    }, [looksStalled])

    /** Ma'lumot HAQIQATAN kelganmi (bo'sh ro'yxat ham — kelgan). */
    const hasData = query.data !== undefined

    /** Ko'rsatishga tayyor: server javob berdi va javob qo'lda. */
    const isReady = query.isSuccess && hasData

    const isFailed = query.isError || isStalled

    return {
        ...query,
        /**
         * Muzlagan so'rov xato sifatida qaraladi — sahifadagi mavjud
         * `if (isError)` shoxobchalari o'z-o'zidan to'g'ri ishlab ketadi.
         */
        isError: isFailed,
        error: (query.error ??
            (isStalled ? new StalledQueryError(url) : null)) as TError,
        /** Ma'lumot bor-yo'qligi (`isSuccess` bilan birga eng ishonchli shart). */
        hasData,
        /** Raqam/ro'yxat chizishga ruxsat beruvchi yagona shart. */
        isReady,
        /** So'rov javobsiz muzlab qolganmi. */
        isStalled,
    }
}
