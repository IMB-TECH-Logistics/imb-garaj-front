import { COMMON_DIRECTIONS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"

export const useNoPriceAlerts = () => {
    const canSee = useHasAction("settings_directions_view")
    const query = useGet<ListResponse<unknown>>(COMMON_DIRECTIONS, {
        params: { no_price: true, page_size: 1 },
        enabled: canSee,
        options: { queryKey: [COMMON_DIRECTIONS, "no-price-alerts"], refetchInterval: 60_000, staleTime: 55_000 },
    })
    const pending = useGet<ListResponse<unknown>>(COMMON_DIRECTIONS, {
        params: { pending_price: true, page_size: 1 },
        enabled: canSee,
        options: { queryKey: [COMMON_DIRECTIONS, "pending-price-alerts"], refetchInterval: 60_000, staleTime: 55_000 },
    })
    const total = (query.data?.count ?? 0) + (pending.data?.count ?? 0)
    return { ...query, canSee, count: canSee ? total : 0 }
}
