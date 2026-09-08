import axiosInstance from "@/services/axios-instance"
import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import { AxiosRequestConfig } from "axios"

const DEFAULT_STALE_TIME = 1000 * 5*60

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
 */
const retryPolicy = (failureCount: number, error: unknown) => {
    const status = (error as { response?: { status?: number } })?.response
        ?.status
    if (typeof status === "number" && status >= 400 && status < 500) {
        return false
    }
    return failureCount < 2
}

export const getRequest = (url: string, config?: AxiosRequestConfig) =>
    axiosInstance.get(`/${url}/`, config).then((res) => res.data)

export const useGet = <TData = any, TQueryFnData = unknown, TError = any>(
    url: string,
    args?: UseGetArgs<TData, TQueryFnData, TError>,
) => {
    const { config, options, params, enabled = true } = args || {}
    const queryKey = buildQueryKey(url, params)


    return useQuery<TQueryFnData, TError, TData>({
        queryKey,
        queryFn: () => getRequest(url, { ...config, params }),
        staleTime: options?.staleTime ?? DEFAULT_STALE_TIME,
        retry: retryPolicy,
        enabled,
        ...options,
    })
}
