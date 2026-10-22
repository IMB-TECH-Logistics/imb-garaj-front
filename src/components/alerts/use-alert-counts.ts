import { ALERTS_COUNTS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import type { AlertCounts } from "./types"

export const useAlertCounts = () => {
    const canVehicles = useHasAction("manager_vehicles_view")
    const canTech = useHasAction("manager_tech_check_view")
    const canSee = canVehicles || canTech
    const query = useGet<AlertCounts>(ALERTS_COUNTS, {
        enabled: canSee,
        options: { refetchInterval: 60_000, staleTime: 55_000 },
    })
    return { ...query, canSee, total: canSee ? (query.data?.total ?? 0) : 0 }
}
