import { MONITORING_STATUS_VEHICLES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { useMemo } from "react"
import { type ApiStatusVehicle, type VehicleRow } from "./data"
import RouteView from "./route-view"
import VehicleList from "./vehicle-list"
import VehicleTimeline from "./timeline"

export default function StatusReport({
    onSelectOnMap,
}: {
    onSelectOnMap?: (vehicleId: number, status: number) => void
}) {
    const navigate = useNavigate()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const search = useSearch({ strict: false }) as any

    const sv = search?.sv as "timeline" | "route" | undefined
    const vehId = search?.sveh != null ? Number(search.sveh) : null
    const routeStatus = search?.sstatus != null ? Number(search.sstatus) : null
    const cameFrom = (search?.sfrom as "list" | "timeline") ?? "list"

    const today = new Date()
    const fromD = search?.from_date
        ? new Date(search.from_date)
        : startOfMonth(today)
    const toD = search?.to_date ? new Date(search.to_date) : endOfMonth(today)

    const { data: vehicles = [], isLoading } = useGet<ApiStatusVehicle[]>(
        MONITORING_STATUS_VEHICLES,
        {
            params: {
                from_date: format(fromD, "yyyy-MM-dd"),
                to_date: format(toD, "yyyy-MM-dd"),
            },
            enabled: vehId != null,
        },
    )

    const vehicle = useMemo<VehicleRow | null>(() => {
        if (vehId == null) return null
        const v = vehicles.find((x) => x.id === vehId)
        if (!v) return null
        return {
            id: v.id,
            truck_number: v.truck_number,
            driver_name: v.driver_name ?? "—",
            type: v.type ?? "—",
            current_status: v.current_status,
        }
    }, [vehId, vehicles])

    const patch = (p: Record<string, unknown>) =>
        navigate({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            search: ((prev: any) => {
                const next = { ...prev, ...p }
                for (const key of Object.keys(next)) {
                    const value = next[key]
                    if (value === undefined || value === null || value === "")
                        delete next[key]
                }
                return next
            }) as any,
        })

    const openTimeline = (v: VehicleRow) =>
        patch({ sv: "timeline", sveh: v.id, sstatus: undefined, sfrom: undefined })
    const openRoute = (
        v: VehicleRow,
        status: number,
        from: "list" | "timeline",
    ) => patch({ sv: "route", sveh: v.id, sstatus: status, sfrom: from })
    const backToList = () =>
        patch({ sv: undefined, sveh: undefined, sstatus: undefined, sfrom: undefined })
    const backToTimeline = (v: VehicleRow) =>
        patch({ sv: "timeline", sveh: v.id, sstatus: undefined, sfrom: undefined })

    if (sv != null && vehId != null && vehicle == null) {
        if (isLoading) return null
        return (
            <VehicleList
                onSelect={openTimeline}
                onStatusSelect={(v, status) => openRoute(v, status, "list")}
            />
        )
    }

    if (sv === "timeline" && vehicle)
        return (
            <VehicleTimeline
                vehicle={vehicle}
                onBack={backToList}
                onShowRoute={(status) =>
                    onSelectOnMap
                        ? onSelectOnMap(vehicle.id, status)
                        : openRoute(vehicle, status, "timeline")
                }
            />
        )

    if (sv === "route" && vehicle && routeStatus != null)
        return (
            <RouteView
                vehicle={vehicle}
                status={routeStatus}
                onBack={() =>
                    cameFrom === "timeline"
                        ? backToTimeline(vehicle)
                        : backToList()
                }
            />
        )

    return (
        <VehicleList
            onSelect={openTimeline}
            onStatusSelect={(v, status) => openRoute(v, status, "list")}
        />
    )
}
