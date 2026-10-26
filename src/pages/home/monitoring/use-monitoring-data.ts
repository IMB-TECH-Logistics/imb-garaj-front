import {
    MONITORING_GPS_LIVE,
    MONITORING_LIVE_TRACKING,
    MONITORING_ORDERS,
    MONITORING_ROUTES_POLYLINE,
    MONITORING_TRIPS_TRACKING,
    MONITORING_VEHICLE_LAST_ORDERS,
    MONITORING_VEHICLES,
    VEHICLES,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useMemo, useState } from "react"
import { useSearchParam } from "./use-monitoring-search"
import { useGpsLiveSocket } from "./gps-socket"
import type { ConnectionFilter, UnlinkedVehicle } from "./gps-list"
import { GPS_FALLBACK_MS, GPS_REFRESH_MS, LIVE_REFRESH_MS } from "./monitoring-model"
import type { MapBounds } from "./route-map"
import { useTrackerHistory } from "./tracker-history"
import type {
    Dimension,
    GpsLiveVehicle,
    LiveDriver,
    MonitoringFilters,
    OrderTracking,
    RoutePolyline,
    TripTracking,
    TruckStatusFilter,
    VehicleLastOrders,
    VehicleTracking,
} from "./types"
import { truckStatusOf } from "./types"

const normalizePlate = (v: string | null | undefined) => (v ?? "").replace(/\s+/g, "").toUpperCase()

export const useMonitoringData = ({ historical, dimension, filters, mode, truckStatus, connection, noGpsOnly, plateQuery }: {
    historical: boolean
    dimension: Dimension
    filters: MonitoringFilters
    mode: "map" | "report"
    truckStatus: TruckStatusFilter
    connection: ConnectionFilter
    noGpsOnly: boolean
    plateQuery: string
}) => {
    const liveConnected = useGpsLiveSocket(!historical)
    const gpsLive = useGet<GpsLiveVehicle[]>(MONITORING_GPS_LIVE, {
        options: {
            retry: 1,
            refetchInterval: (query) =>
                historical
                    ? false
                    : query.state.status === "error" || liveConnected
                      ? GPS_FALLBACK_MS
                      : GPS_REFRESH_MS,
            refetchIntervalInBackground: false,
        },
    })

    const drivers = useGet<LiveDriver[]>(MONITORING_LIVE_TRACKING, {
        params: { include_stale: true },
        enabled: dimension === "driver",
        options: {
            refetchInterval: historical ? false : LIVE_REFRESH_MS,
            refetchIntervalInBackground: false,
        },
    })

    const orders = useGet<OrderTracking[]>(MONITORING_ORDERS, {
        enabled: dimension === "order",
        options: {
            refetchInterval: historical ? false : LIVE_REFRESH_MS,
            refetchIntervalInBackground: false,
        },
    })

    const trips = useGet<TripTracking[]>(MONITORING_TRIPS_TRACKING, {
        enabled: dimension === "trip",
        options: {
            refetchInterval: historical ? false : LIVE_REFRESH_MS,
            refetchIntervalInBackground: false,
        },
    })

    const vehicles = useGet<VehicleTracking[]>(MONITORING_VEHICLES, {
        enabled: dimension === "vehicle",
        options: {
            refetchInterval: historical ? false : LIVE_REFRESH_MS,
            refetchIntervalInBackground: false,
        },
    })

    const polyline = useGet<RoutePolyline>(MONITORING_ROUTES_POLYLINE, {
        params: {
            ...(filters.trip ? { trip: filters.trip } : {}),
            ...(filters.order ? { order: filters.order } : {}),
            ...(filters.driver ? { driver: filters.driver } : {}),
            ...(filters.vehicle ? { vehicle: filters.vehicle } : {}),
            ...(filters.fromDate ? { from_date: filters.fromDate } : {}),
            ...(filters.toDate ? { to_date: filters.toDate } : {}),
            max_points: 2000,
        },
        enabled: historical,
    })

    const liveDrivers = useMemo<LiveDriver[]>(
        () => drivers.data ?? [],
        [drivers.data],
    )

    const polylineData = polyline.data

    const [trackerImei, setTrackerImei] = useSearchParam("imei")
    const [panelOpen, setPanelOpen] = useState(true)
    const history = useTrackerHistory(trackerImei)
    const lastOrders = useGet<VehicleLastOrders>(MONITORING_VEHICLE_LAST_ORDERS, {
        enabled: !historical,
        options: { staleTime: 60 * 1000, refetchInterval: 60 * 1000 },
    })
    const ordersByVehicle = useMemo(
        () => Object.fromEntries((lastOrders.data?.results ?? []).map((o) => [o.vehicle, o])),
        [lastOrders.data],
    )
    const linkedItems = useMemo(() => (gpsLive.data ?? []).filter((g) => g.vehicle != null), [gpsLive.data])
    const truckStatusCounts = useMemo(() => {
        const counts: Record<TruckStatusFilter, number> = { all: 0, loaded: 0, empty: 0, garage: 0, repair: 0 }
        for (const g of linkedItems) {
            counts.all += 1
            counts[truckStatusOf(g, g.vehicle != null ? ordersByVehicle[g.vehicle] : undefined)] += 1
        }
        return counts
    }, [linkedItems, ordersByVehicle])
    const connectionCounts = useMemo(() => {
        const online = linkedItems.filter((g) => g.status === "online").length
        return { all: linkedItems.length, online, offline: linkedItems.length - online }
    }, [linkedItems])
    const plateNeedle = normalizePlate(plateQuery)
    const cargoItems = useMemo(
        () =>
            noGpsOnly ? [] : linkedItems.filter(
                (g) =>
                    (truckStatus === "all" ||
                        truckStatusOf(g, g.vehicle != null ? ordersByVehicle[g.vehicle] : undefined) ===
                            truckStatus) &&
                    (connection === "all" || (g.status === "online") === (connection === "online")) &&
                    (!plateNeedle || normalizePlate(g.vehicle_number).includes(plateNeedle)),
            ),
        [linkedItems, ordersByVehicle, truckStatus, connection, noGpsOnly, plateNeedle],
    )
    const allVehicles = useGet<{ results: (UnlinkedVehicle & { gps_imei: string | null })[] }>(VEHICLES, {
        params: { page_size: 1000 },
        enabled: mode === "map" && dimension === "driver" && !historical,
        options: { staleTime: 60 * 1000 },
    })
    const allUnlinked = useMemo(
        () => (allVehicles.data?.results ?? []).filter((v) => !v.gps_imei),
        [allVehicles.data],
    )
    const unlinkedVehicles = truckStatus === "all" && connection === "all" && !noGpsOnly
        ? allUnlinked.filter((v) => !plateNeedle || normalizePlate(v.truck_number).includes(plateNeedle))
        : []
    const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)
    const visibleItems = useMemo(
        () =>
            mapBounds
                ? cargoItems.filter(
                      (g) =>
                          g.lat != null &&
                          g.lng != null &&
                          g.lat <= mapBounds.north &&
                          g.lat >= mapBounds.south &&
                          g.lng <= mapBounds.east &&
                          g.lng >= mapBounds.west,
                  )
                : cargoItems,
        [cargoItems, mapBounds],
    )
    const selectTracker = (imei: string | null) => {
        setTrackerImei(imei)
    }
    return {
        gpsLive,
        drivers,
        orders,
        trips,
        vehicles,
        polyline,
        liveDrivers,
        polylineData,
        trackerImei,
        setTrackerImei,
        panelOpen,
        setPanelOpen,
        history,
        ordersByVehicle,
        truckStatusCounts,
        connectionCounts,
        cargoItems,
        allUnlinked,
        unlinkedVehicles,
        setMapBounds,
        visibleItems,
        selectTracker,
    }
}
