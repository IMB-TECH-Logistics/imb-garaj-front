import { WAREHOUSE_PRODUCTS } from "@/constants/api-endpoints"
import { buildQueryKey, getRequest } from "@/hooks/useGet"
import { useTenantRequest, withReadTenant } from "@/lib/tenant-scope"
import { useQueries } from "@tanstack/react-query"
import type { WhLot } from "../ombor/types"

const STALE_TIME = 1000 * 30

export const useProductLots = (productIds: number[]) => {
    const { scope, pending } = useTenantRequest(WAREHOUSE_PRODUCTS)
    const params = { in_stock: 1, page_size: 1000 }

    return useQueries({
        queries: productIds.map((id) => {
            const url = `${WAREHOUSE_PRODUCTS}/${id}/lots`
            const baseKey = buildQueryKey(url, params)
            return {
                queryKey: scope ? [...baseKey, scope] : baseKey,
                queryFn: (): Promise<ListResponse<WhLot>> =>
                    getRequest(url, { ...withReadTenant(scope), params }),
                staleTime: STALE_TIME,
                enabled: !pending,
            }
        }),
        combine: (results) => {
            const byProduct: Record<number, WhLot[] | undefined> = {}
            results.forEach((result, index) => {
                byProduct[productIds[index]] = result.data?.results
            })
            return byProduct
        },
    })
}
