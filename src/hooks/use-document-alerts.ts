import { VEHICLE_DOCUMENT_ALERTS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { DocumentAlerts } from "@/pages/home/settings/documents/types"

export const useDocumentAlerts = () => {
    const canSee = useHasAction("settings_vehicles_view")
    const query = useGet<DocumentAlerts>(VEHICLE_DOCUMENT_ALERTS, {
        enabled: canSee,
        options: { refetchInterval: 60_000, staleTime: 55_000 },
    })
    return { ...query, canSee, count: canSee ? query.data?.count ?? 0 : 0 }
}
