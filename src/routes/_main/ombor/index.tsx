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
        receipt: search.receipt ? 1 : undefined,
        lpage: Number(search.lpage) || undefined,
        lpage_size: Number(search.lpage_size) || undefined,
        section: search.section === "items" ? "items" : undefined,
        item: Number(search.item) || undefined,
        istate: search.istate ? String(search.istate) : undefined,
        icond: search.icond ? String(search.icond) : undefined,
        ipage: Number(search.ipage) || undefined,
        ipage_size: Number(search.ipage_size) || undefined,
    }),
})
