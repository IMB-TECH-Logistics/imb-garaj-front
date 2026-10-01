import { useNavigate, useSearch } from "@tanstack/react-router"
import type { OmborSearchParams, WhTab } from "./types"

export const useOmborSearch = () => {
    const search = useSearch({ strict: false }) as OmborSearchParams
    const navigate = useNavigate()

    const update = (patch: Partial<OmborSearchParams>) =>
        navigate({
            search: (prev: Record<string, unknown>) => ({
                ...prev,
                ...patch,
            }),
        } as never)

    return {
        product: search.product,
        lot: search.lot,
        tab: search.tab,
        select: (product?: number, lot?: number) =>
            update({ product, lot, lpage: undefined }),
        clear: () => update({ product: undefined, lot: undefined, lpage: undefined }),
        setTab: (tab: WhTab) => update({ tab, lpage: undefined }),
    }
}
