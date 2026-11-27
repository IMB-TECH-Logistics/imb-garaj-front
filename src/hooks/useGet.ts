import axiosInstance from "@/services/axios-instance"
import { useTenantRequest, withReadTenant } from "@/lib/tenant-scope"
import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import { AxiosRequestConfig } from "axios"

const DEFAULT_STALE_TIME = 1000 * 5*60

// Kalitda parametr NOMI ham bo'lishi shart: faqat qiymatlar olinsa
// {no_price: true} va {pending_price: true} bir xil kalit [url, true] bo'lib,
// filtr almashganda keshdagi boshqa filtr ma'lumoti qaytib qolardi.
export const buildQueryKey = (url: string, params?: Record<string, any>) => {
    const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(
            ([, v]) => v !== undefined && v !== null && v !== "",
        ),
    )
    return Object.keys(cleanParams).length > 0 ? [url, cleanParams] : [url]
}

export type UseGetArgs<TData = any, TQueryFnData = unknown, TError = any> = {
    options?: Partial<UseQueryOptions<TQueryFnData, TError, TData>>
    config?: Omit<AxiosRequestConfig, "params">
    params?: Record<string, unknown>
    enabled?: boolean
}

export const getRequest = (url: string, config?: AxiosRequestConfig) =>
    axiosInstance.get(`/${url}/`, config).then((res) => res.data)

export const useGet = <TData = any, TQueryFnData = unknown, TError = any>(
    url: string,
    args?: UseGetArgs<TData, TQueryFnData, TError>,
) => {
    const { config, options, params, enabled = true } = args || {}
    const { scope, pending } = useTenantRequest(url)
    const baseKey = buildQueryKey(url, params)
    const queryKey = scope ? [...baseKey, scope] : baseKey


    return useQuery<TQueryFnData, TError, TData>({
        queryKey,
        queryFn: () =>
            getRequest(url, { ...withReadTenant(scope, config), params }),
        staleTime: options?.staleTime ?? DEFAULT_STALE_TIME,
        enabled,
        ...options,
        ...(pending && { enabled: false }),
    })
}
