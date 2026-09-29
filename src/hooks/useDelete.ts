import axiosInstance from "@/services/axios-instance"
import { useTenantRequest, withWriteTenant } from "@/lib/tenant-scope"
import { useMutation, UseMutationOptions } from "@tanstack/react-query"
import { AxiosRequestConfig } from "axios"

export const deleteRequest = (url: string, config?: AxiosRequestConfig) =>
    axiosInstance.delete(`/${url}/`, config).then((res) => res.data)

export const useDelete = (
    options?: Partial<UseMutationOptions<any, any, string>>,
    config?: AxiosRequestConfig,
) => {
    const { scope } = useTenantRequest("")
    return useMutation<any, any, string>({
        mutationFn: (url) =>
            deleteRequest(url, withWriteTenant(url, scope, config)),
        ...(options || {}),
    })
}
