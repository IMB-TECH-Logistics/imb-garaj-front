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
    return { ...query, canSee, count: canSee ? query.data?.count ?? 0 : 0 }
}
