import { MANAGERS_TRIPS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"

export function useTripCashClosed(tripId?: number | string | null) {
    const { data } = useGet<{ cash_closed?: boolean }>(`${MANAGERS_TRIPS}/${tripId}`, {
        enabled: !!tripId,
        options: { retry: false },
    })
    return !!data?.cash_closed
}
