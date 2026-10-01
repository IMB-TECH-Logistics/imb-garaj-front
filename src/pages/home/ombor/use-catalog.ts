import { WAREHOUSE_PRODUCTS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import type { WhProduct } from "./types"

export const useCatalog = () =>
    useGet<ListResponse<WhProduct>>(WAREHOUSE_PRODUCTS, {
        params: { page_size: 1000 },
    })
