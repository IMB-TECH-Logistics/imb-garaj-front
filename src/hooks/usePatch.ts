import { handleFormError } from "@/lib/show-form-errors"
import axiosInstance from "@/services/axios-instance"
import {
    MutateOptions,
    useMutation,
    UseMutationOptions,
} from "@tanstack/react-query"
import { AxiosRequestConfig } from "axios"

export const patchRequest = <T>(
    url: string,
    payload: T,
    config?: AxiosRequestConfig,
) =>
    axiosInstance
        .patch(`/${url}/`, payload, {
            ...(!(payload instanceof FormData) && {
                headers: { "Content-Type": "application/json" },
            }),
            ...config,
        })
        .then((res) => res.data)

export const putRequest = <T>(
    url: string,
    payload: T,
    config?: AxiosRequestConfig,
) => axiosInstance.put(`/${url}/`, payload, config).then((res) => res.data)

export const usePatch = <P = any, D = any>(
    options?: Partial<UseMutationOptions<D, any, { url: string; payload: P }>>,
    config?: AxiosRequestConfig,
) => {


    const mutation = useMutation<D, any, { url: string; payload: P }>({
        mutationFn: ({ url, payload }) => patchRequest(url, payload, config),
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
        mutation.mutate({ url, payload }, {
            ...mutateOptions,
            onError: (error, variables, context) => {
                if (mutateOptions?.onError) {
                    mutateOptions.onError(error, variables, context);
                } else {
                    handleFormError(error);
                }
            },
        })
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
    ) => mutation.mutateAsync({ url, payload }, {
        ...mutateOptions,
        onError: (error, variables, context) => {
            if (mutateOptions?.onError) {
                mutateOptions.onError(error, variables, context);
            } else {
                handleFormError(error);
            }
        },
    })

    return { ...mutation, mutate, mutateAsync }
}
