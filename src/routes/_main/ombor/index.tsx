import type { OmborSearchParams } from "@/pages/home/ombor/types"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_main/ombor/")({
    validateSearch: (search: Record<string, unknown>): OmborSearchParams => ({
        product: Number(search.product) || undefined,
        lot: Number(search.lot) || undefined,
        tab:
            search.tab === "receipts" || search.tab === "withdrawals" ?
                search.tab
            :   undefined,
        category: Number(search.category) || undefined,
        receipt: search.receipt ? 1 : undefined,
        lpage: Number(search.lpage) || undefined,
        lpage_size: Number(search.lpage_size) || undefined,
    }),
})
