import {
    InfiniteData,
    QueryKey,
    useInfiniteQuery,
    UseInfiniteQueryOptions,
} from "@tanstack/react-query"
import { AxiosRequestConfig } from "axios"
import { useTenantRequest, withReadTenant } from "@/lib/tenant-scope"
import { getRequest } from "./useGet"

type ICustomUseInfiniteQueryOptions<TQueryFnData, TError, TData> = Partial<
    UseInfiniteQueryOptions<TQueryFnData, TError, TData>
>

type UseInfiniteArgs<TQueryFnData = unknown, TError = any> = {
    deps?: QueryKey
    options?: ICustomUseInfiniteQueryOptions<
        TQueryFnData,
        TError,
        InfiniteData<TQueryFnData, unknown>
    >
    config?: Omit<AxiosRequestConfig, "params">
    params?: Record<string, unknown>
    page_key?: string
}

export const useInfinite = <
    TData = any,
    TQueryFnData = {
        results: TData[]
        total_pages: number
        current_page: number
    },
    TError = any,
>(
    url: string,
    args?: UseInfiniteArgs<TQueryFnData, TError>,
) => {
    const { deps, options, config, params, page_key = "page" } = args || {}
    const { scope, pending } = useTenantRequest(url)
    const baseKey = deps
        ? [url, ...deps, ...Object.values(params || {})]
        : [url, ...Object.values(params || {})]
    return useInfiniteQuery<TQueryFnData, TError, TData>({
        queryKey: scope ? [...baseKey, scope] : baseKey,
        queryFn: async ({ pageParam = 1 }) => {
            const response = await getRequest(url, {
                ...withReadTenant(scope, config),
                params: {
                    ...params,
                    [page_key]: pageParam,
                },
            })

            return {
                ...response,
                results: response.results || [],
            }
        },
        getNextPageParam: (lastPage, allPages) => {
            const totalPages = (lastPage as any)?.total_pages
            const currentPage = allPages.length
            return currentPage < totalPages ? currentPage + 1 : undefined
        },

        initialPageParam: undefined,
        // @ts-expect-error default settings
        select: ({ pages }) =>
            // @ts-expect-error default settings
            pages.flatMap((page) => page.results) || [],
        ...(options || {}),
        ...(pending && { enabled: false }),
    })
}
