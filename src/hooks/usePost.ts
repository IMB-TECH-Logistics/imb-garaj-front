import axiosInstance from "@/services/axios-instance"
import { useTenantRequest, withWriteTenant } from "@/lib/tenant-scope"
import {
    MutateOptions,
    useMutation,
    UseMutationOptions,
} from "@tanstack/react-query"
import { AxiosRequestConfig } from "axios"

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
    const mutation = useMutation<D, any, { url: string; payload: P }>({
        mutationFn: ({ url, payload }) =>
            postRequest(url, payload, withWriteTenant(url, scope, config)),
        ...(options || {}),
    })

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
        mutation.mutate({ url, payload }, mutateOptions)
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
    ) => mutation.mutateAsync({ url, payload }, mutateOptions)

    return { ...mutation, mutate, mutateAsync }
}
