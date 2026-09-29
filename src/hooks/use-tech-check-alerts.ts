import { TECHNICAL_INSPECT_ALERTS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import type { VehicleExpenseRow } from "@/pages/home/texnik-check/cols"

export type TechCheckAlerts = {
    count: number
    expired: number
    expiring: number
    results: VehicleExpenseRow[]
}

export const useTechCheckAlerts = () => {
    const canSee = useHasAction("manager_tech_check_view")
    const query = useGet<TechCheckAlerts>(TECHNICAL_INSPECT_ALERTS, {
        enabled: canSee,
        options: { refetchInterval: 60_000, staleTime: 55_000 },
    })
    return { ...query, canSee, count: canSee ? query.data?.count ?? 0 : 0 }
}
