import { useNavigate, useSearch } from "@tanstack/react-router"
import { useMemo } from "react"
import type { ConnectionFilter } from "./gps-list"
import { num } from "./monitoring-model"
import type { Dimension, MonitoringFilters, TruckStatusFilter } from "./types"
import { TRUCK_STATUS_FILTERS, isHistoricalView, todayIso } from "./types"

export const useMonitoringSearch = () => {
    const navigate = useNavigate()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const search = useSearch({ strict: false }) as any
    const patchSearch = (patch: Record<string, unknown>) =>
        navigate({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            search: ((prev: any) => {
                const next = { ...prev, ...patch }
                for (const key of Object.keys(next)) {
                    const v = next[key]
                    if (v === undefined || v === null || v === "")
                        delete next[key]
                }
                return next
            }) as any,
        })

    const dimension: Dimension = (search?.dimension as Dimension) ?? "driver"
    const filters: MonitoringFilters = useMemo(
        () => ({
            driver: num(search?.driver),
            order: num(search?.order),
            trip: num(search?.trip),
            vehicle: num(search?.vehicle),
            fromDate: (search?.mdate as string) ?? "",
            toDate: (search?.mdate as string) ?? "",
        }),
        [
            search?.driver,
            search?.order,
            search?.trip,
            search?.vehicle,
            search?.mdate,
        ],
    )
    const setFilters = (f: MonitoringFilters) =>
        patchSearch({
            driver: f.driver ?? undefined,
            order: f.order ?? undefined,
            trip: f.trip ?? undefined,
            vehicle: f.vehicle ?? undefined,
            mdate: f.fromDate || undefined,
            status: undefined,
        })

    const mode: "map" | "report" = search?.report ? "report" : "map"
    const setMode = (m: "map" | "report") =>
        patchSearch({ report: m === "report" ? 1 : undefined })

    const activeStatus = num(search?.status)
    const toggleStatus = (s: number) =>
        patchSearch({ status: activeStatus === s ? undefined : s })

    const selectFromStatus = (vehicleId: number, status: number) =>
        patchSearch({
            report: undefined,
            dimension: "vehicle",
            driver: undefined,
            order: undefined,
            trip: undefined,
            vehicle: vehicleId,
            mdate: todayIso(),
            status,
        })

    const historical = isHistoricalView(filters)
    const selectedId =
        filters.driver ?? filters.order ?? filters.trip ?? filters.vehicle

    const truckStatus: TruckStatusFilter = TRUCK_STATUS_FILTERS.includes(search?.truck_status)
        ? search.truck_status
        : "all"
    const noGpsOnly = String(search?.nogps ?? "") === "1"
    const setNoGps = (on: boolean) =>
        patchSearch({ nogps: on ? "1" : undefined, truck_status: undefined, conn: undefined })
    const setTruckStatus = (next: TruckStatusFilter) =>
        patchSearch({ truck_status: next === "all" ? undefined : next, conn: undefined, nogps: undefined })
    const connection: ConnectionFilter =
        search?.conn === "online" || search?.conn === "offline" ? search.conn : "all"
    const setConnection = (next: ConnectionFilter) =>
        patchSearch({ conn: next === "all" ? undefined : next, truck_status: undefined, nogps: undefined })
    return {
        navigate,
        search,
        patchSearch,
        dimension,
        filters,
        setFilters,
        mode,
        setMode,
        activeStatus,
        toggleStatus,
        selectFromStatus,
        historical,
        selectedId,
        truckStatus,
        noGpsOnly,
        setNoGps,
        setTruckStatus,
        connection,
        setConnection,
    }
}
