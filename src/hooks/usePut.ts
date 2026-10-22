import axiosInstance from "@/services/axios-instance"
import { useTenantRequest, withWriteTenant } from "@/lib/tenant-scope"
import {
    MutateOptions,
    useMutation,
    UseMutationOptions,
} from "@tanstack/react-query"
import { AxiosRequestConfig } from "axios"

export const putRequest = <T>(
    url: string,
    payload: T,
    config?: AxiosRequestConfig,
) => axiosInstance.put(`/${url}/`, payload, config).then((res) => res.data)

export const usePut = <P = any, D = any>(
    options?: Partial<UseMutationOptions<D, any, { url: string; payload: P }>>,
    config?: AxiosRequestConfig,
) => {
    const { scope } = useTenantRequest("")
    const mutation = useMutation<D, any, { url: string; payload: P }>({
        mutationFn: ({ url, payload }) =>
            putRequest(url, payload, withWriteTenant(url, scope, config)),
        ...(options || {}),
    })

    const mutate = (
        url: string,
        payload: P,
        mutateOptions?: MutateOptions<D, any, { url: string; payload: P }, unknown>,
    ) => {
        mutation.mutate({ url, payload }, mutateOptions)
    }

    return { ...mutation, mutate }
}
