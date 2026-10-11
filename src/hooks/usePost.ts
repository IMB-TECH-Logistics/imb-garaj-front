import axiosInstance from "@/services/axios-instance"
import { useTenantRequest, withWriteTenant } from "@/lib/tenant-scope"
import {
    MutateOptions,
    useMutation,
    UseMutationOptions,
} from "@tanstack/react-query"
import { AxiosRequestConfig } from "axios"
import { useRef } from "react"

/**
 * S-E3-02: bir xil so'rov (yo'l + tana) javobi kelmasidan qayta yuborilmaydi.
 * Tugma `loading`/`disabled` bo'lishi keyingi renderdan boshlab ishlaydi —
 * bir zumda ikki marta bosish (yoki Enter + bosish) shu oraliqqa tushadi.
 */
const submitKey = (url: string, payload: unknown): string => {
    if (payload instanceof FormData) {
        const parts: string[] = []
        payload.forEach((v, k) =>
            parts.push(`${k}=${v instanceof File ? `${v.name}:${v.size}` : v}`),
        )
        return `${url}|${parts.join("&")}`
    }
    try {
        return `${url}|${JSON.stringify(payload)}`
    } catch {
        return `${url}|${String(payload)}`
    }
}

export const postRequest = <T>(
    url: string,
    payload: T,
    config: AxiosRequestConfig = {},
) =>
    axiosInstance
        .post(`/${url}/`, payload, {
            ...config,
            ...(!(payload instanceof FormData) && {
                headers: {
                    "Content-Type": "application/json",
                    ...config.headers,
                },
            }),
        })
        .then((res) => res.data)

export const usePost = <P = any, D = any>(
    options?: Partial<UseMutationOptions<D, any, { url: string; payload: P }>>,
    config?: AxiosRequestConfig,
) => {
    const { scope } = useTenantRequest("")
    const inFlight = useRef(new Map<string, Promise<D>>())
    const mutation = useMutation<D, any, { url: string; payload: P }>({
        mutationFn: ({ url, payload }) =>
            postRequest(url, payload, withWriteTenant(url, scope, config)),
        ...(options || {}),
    })
    const release = (key: string) => () => {
        inFlight.current.delete(key)
    }

    const mutate = (
        url: string,
        payload: P,
        mutateOptions?: MutateOptions<
            D,
            any,
            { url: string; payload: P },
            unknown
        >,
    ) => {
        const key = submitKey(url, payload)
        if (inFlight.current.has(key)) return
        const promise = mutation.mutateAsync({ url, payload }, mutateOptions)
        inFlight.current.set(key, promise)
        promise.then(release(key), release(key))
    }

    const mutateAsync = (
        url: string,
        payload: P,
        mutateOptions?: MutateOptions<
            D,
            any,
            { url: string; payload: P },
            unknown
        >,
    ) => {
        const key = submitKey(url, payload)
        const running = inFlight.current.get(key)
        if (running) return running
        const promise = mutation.mutateAsync({ url, payload }, mutateOptions)
        inFlight.current.set(key, promise)
        promise.then(release(key), release(key))
        return promise
    }

    return { ...mutation, mutate, mutateAsync }
}
