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

export const useMonitoringData = ({ historical, dimension, filters, mode, truckStatus, connection, noGpsOnly }: {
    historical: boolean
    dimension: Dimension
    filters: MonitoringFilters
    mode: "map" | "report"
    truckStatus: TruckStatusFilter
    connection: ConnectionFilter
    noGpsOnly: boolean
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

    const [trackerImei, setTrackerImei] = useState<string | null>(null)
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
    const truckStatusCounts = useMemo(() => {
        const counts: Record<TruckStatusFilter, number> = { all: 0, loaded: 0, empty: 0, repair: 0 }
        for (const g of gpsLive.data ?? []) {
            counts.all += 1
            counts[truckStatusOf(g, g.vehicle != null ? ordersByVehicle[g.vehicle] : undefined)] += 1
        }
        return counts
    }, [gpsLive.data, ordersByVehicle])
    const connectionCounts = useMemo(() => {
        const all = gpsLive.data ?? []
        const online = all.filter((g) => g.status === "online").length
        return { all: all.length, online, offline: all.length - online }
    }, [gpsLive.data])
    const cargoItems = useMemo(
        () =>
            noGpsOnly ? [] : (gpsLive.data ?? []).filter(
                (g) =>
                    (truckStatus === "all" ||
                        truckStatusOf(g, g.vehicle != null ? ordersByVehicle[g.vehicle] : undefined) ===
                            truckStatus) &&
                    (connection === "all" || (g.status === "online") === (connection === "online")),
            ),
        [gpsLive.data, ordersByVehicle, truckStatus, connection, noGpsOnly],
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
    const unlinkedVehicles = truckStatus === "all" && connection === "all" && !noGpsOnly ? allUnlinked : []
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
