import {
    MONITORING_STATUS_GPS_TIMELINE,
    MONITORING_STATUS_ROWS,
    MONITORING_STATUS_ROUTE,
    MONITORING_STATUS_TIMELINE,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { parseLocalDate } from "./historical-summary"
import { LIVE_REFRESH_MS } from "./monitoring-model"
import type { LiveMarker } from "./route-map"
import { type ApiStatusRoute, type ApiStatusSegment, type ApiVehicleRow, type ColoredPathSegment, ROW_KIND_STATUS, STATUS_META } from "./status/data"
import type { LiveDriver, OrderTracking, TripTracking, VehicleTracking } from "./types"
import { EMPTY_FILTERS, isRussiaTruck, todayIso, truckStatusOf } from "./types"
import { useMonitoringData } from "./use-monitoring-data"
import { useMonitoringSearch } from "./use-monitoring-search"

export const useMonitoringController = () => {
    const { t } = useTranslation()
    const {
        navigate,
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
    } = useMonitoringSearch()
    const [plateQuery, setPlateQuery] = useState("")
    const {
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
    } = useMonitoringData({ historical, dimension, filters, mode, truckStatus, connection, noGpsOnly, plateQuery })
    const gpsMarkers: LiveMarker[] = useMemo(() => {
        if (historical) return []
        return cargoItems
            .filter((g) => g.lat != null && g.lng != null)
            .map((g) => ({
                id: `gps-${g.imei}`,
                lat: g.lat as number,
                lng: g.lng as number,
                label: g.vehicle_number || g.tracker_name || g.imei,
                sub:
                    g.speed != null
                        ? `${Math.round(g.speed)} ${t("mon.units.kmh")}`
                        : g.driver_name ?? undefined,
                stale: g.status !== "online",
                icon: "truck" as const,
                tone: truckStatusOf(g, g.vehicle != null ? ordersByVehicle[g.vehicle] : undefined),
                russia: isRussiaTruck(g),
                course: g.course,
                selected: g.imei === trackerImei,
                onClick: () => selectTracker(g.imei),
            }))
    }, [cargoItems, historical, trackerImei, ordersByVehicle, t])

    const liveMarkers: LiveMarker[] = useMemo(() => {
        if (historical) return []
        if (dimension === "driver") {
            return liveDrivers
                .filter((d) => d.lat != null && d.lng != null)
                .map((d) => ({
                    id: d.user,
                    lat: d.lat as number,
                    lng: d.lng as number,
                    label: d.vehicle_number || d.driver_name || `#${d.user}`,
                    sub: d.vehicle_number
                        ? d.driver_name ?? undefined
                        : undefined,
                    stale: d.seconds_since > 5 * 60,
                    selected: false,
                    onClick: () => selectDriver(d),
                }))
        }
        if (dimension === "order") {
            return (orders.data ?? [])
                .filter((o) => o.lat != null && o.lng != null)
                .map((o) => ({
                    id: o.id,
                    lat: o.lat as number,
                    lng: o.lng as number,
                    label: t("mon.order_n", { id: o.id }),
                    sub: o.driver_name ?? o.vehicle_number ?? undefined,
                    stale:
                        o.seconds_since == null || o.seconds_since > 5 * 60,
                    onClick: () => selectOrder(o),
                }))
        }
        if (dimension === "trip") {
            return (trips.data ?? [])
                .filter((trip) => trip.lat != null && trip.lng != null)
                .map((trip) => ({
                    id: trip.id,
                    lat: trip.lat as number,
                    lng: trip.lng as number,
                    label: t("mon.trip_n", { id: trip.id }),
                    sub: trip.driver_name ?? trip.vehicle_number ?? undefined,
                    stale:
                        trip.seconds_since == null || trip.seconds_since > 5 * 60,
                    onClick: () => selectTrip(trip),
                }))
        }
        return (vehicles.data ?? [])
            .filter((v) => v.lat != null && v.lng != null)
            .map((v) => ({
                id: v.id,
                lat: v.lat as number,
                lng: v.lng as number,
                label: v.truck_number,
                sub: v.driver_name ?? undefined,
                stale: v.seconds_since == null || v.seconds_since > 5 * 60,
                onClick: () => selectVehicle(v),
            }))
    }, [
        historical,
        dimension,
        liveDrivers,
        orders.data,
        trips.data,
        vehicles.data,
        t,
    ])

    // Hozircha xaritada faqat gps-backend trekerlari ko'rsatiladi.
    // Haydovchi/buyurtma/reys markerlarini qaytarish uchun liveMarkers'ni qo'shing:
    // () => [...liveMarkers, ...gpsMarkers], [liveMarkers, gpsMarkers]

    function selectDriver(d: LiveDriver) {
        setFilters({
            ...EMPTY_FILTERS,
            driver: d.user,
            fromDate: todayIso(),
            toDate: "",
        })
    }
    function selectOrder(o: OrderTracking) {
        setFilters({
            ...EMPTY_FILTERS,
            order: o.id,
            fromDate: todayIso(),
            toDate: "",
        })
    }
    function selectTrip(t: TripTracking) {
        setFilters({
            ...EMPTY_FILTERS,
            trip: t.id,
            fromDate: todayIso(),
            toDate: "",
        })
    }
    function selectVehicle(v: VehicleTracking) {
        setFilters({
            ...EMPTY_FILTERS,
            vehicle: v.id,
            fromDate: todayIso(),
            toDate: "",
        })
    }

    const activeList = (() => {
        switch (dimension) {
            case "driver":
                return drivers
            case "order":
                return orders
            case "trip":
                return trips
            case "vehicle":
                return vehicles
        }
    })()

    const refreshing = historical
        ? polyline.isFetching
        : activeList.isFetching
    const handleRefresh = () =>
        historical ? polyline.refetch() : activeList.refetch()

    const panelTitle = historical
        ? t("page.turnover_detail")
        : ({
              driver: t("nav.drivers"),
              order: t("nav.manager"),
              trip: t("page.trips"),
              vehicle: t("nav.vehicles"),
          } as const)[dimension]

    // Hozircha "driver" ko'rinishida gps-backend trekerlari sanaladi.
    // Eski hisob: liveDrivers.filter((d) => d.seconds_since <= 5 * 60).length
    const gpsItems = gpsLive.data ?? []
    const selectedTracker = gpsItems.find((g) => g.imei === trackerImei) ?? null
    const replayTimeline = useGet<ApiStatusSegment[]>(MONITORING_STATUS_TIMELINE, {
        params: {
            vehicle: selectedTracker?.vehicle ?? undefined,
            from_date: history.range?.from,
            to_date: history.range?.to,
        },
        enabled: selectedTracker?.vehicle != null && !!history.range,
        options: {
            refetchInterval: history.live ? LIVE_REFRESH_MS : false,
            refetchIntervalInBackground: false,
        },
    })
    const replayGpsTimeline = useGet<ApiStatusSegment[]>(MONITORING_STATUS_GPS_TIMELINE, {
        params: {
            vehicle: selectedTracker?.vehicle ?? undefined,
            from_date: history.range?.from,
            to_date: history.range?.to,
        },
        enabled: selectedTracker?.vehicle != null && !!history.range,
        options: {
            refetchInterval: history.live ? LIVE_REFRESH_MS : false,
            refetchIntervalInBackground: false,
        },
    })
    const replayRows = useGet<ApiVehicleRow[]>(MONITORING_STATUS_ROWS, {
        params: {
            vehicle: selectedTracker?.vehicle ?? undefined,
            from_date: history.range?.from,
            to_date: history.range?.to,
        },
        enabled: selectedTracker?.vehicle != null && !!history.range,
        options: {
            refetchInterval: history.live ? LIVE_REFRESH_MS : false,
            refetchIntervalInBackground: false,
        },
    })
    const replaySegments = replayGpsTimeline.data?.length
        ? replayGpsTimeline.data
        : replayTimeline.data
    const rowStatuses = useMemo(
        () =>
            (replayRows.data ?? []).flatMap((row, i) => {
                const common = {
                    order: row.order_id,
                    from: row.from_place,
                    to: row.to_place,
                    routeKm: row.km,
                    fuel: row.fuel,
                    kind: row.kind,
                    externalId: row.external_id,
                    rowKey: row.order_id != null ? `o${row.order_id}` : `${row.kind}:${row.start}:${i}`,
                }
                if (row.kind === "reys" && row.stages.length) {
                    return row.stages.map((stage) => ({
                        ...common,
                        status: stage.status,
                        start: Date.parse(stage.start),
                        end: Date.parse(stage.end),
                    }))
                }
                return [{
                    ...common,
                    status: row.kind === "reys" ? 6 : ROW_KIND_STATUS[row.kind],
                    start: Date.parse(row.start),
                    end: Date.parse(row.end),
                }]
            }),
        [replayRows.data],
    )
    const legacyStatuses = useMemo(
        () =>
            (replaySegments ?? []).map((s) => ({
                status: s.status,
                start: Date.parse(s.start),
                end: Date.parse(s.end),
                order: (s as { order_id?: number | null }).order_id ?? null,
                from: (s as { from_place?: string | null }).from_place ?? null,
                to: (s as { to_place?: string | null }).to_place ?? null,
                routeKm: (s as { route_km?: number | null }).route_km ?? null,
            })),
        [replaySegments],
    )
    const replayStatuses = replayRows.data ? rowStatuses : legacyStatuses
    const setHistoryStatuses = history.setStatusSegments
    useEffect(() => {
        setHistoryStatuses(replayStatuses)
    }, [replayStatuses, setHistoryStatuses])
    const trackerHeaderVisible =
        mode === "map" && !historical && dimension === "driver" && selectedTracker != null
    const replayBar = mode === "map" && !!trackerImei && history.replay.points.length >= 2
    const backToAll = () => {
        selectTracker(null)
        if (selectedId != null) setFilters(EMPTY_FILTERS)
    }
    const freshCount =
        dimension === "driver"
            ? gpsItems.filter((g) => g.status === "online").length
            : null

    const ribbonDate = filters.fromDate
        ? parseLocalDate(filters.fromDate)
        : null

    const selectedDriver = useMemo(
        () =>
            filters.driver != null
                ? (liveDrivers.find((d) => d.user === filters.driver) ?? null)
                : null,
        [filters.driver, liveDrivers],
    )
    const selectedVehicle = useMemo(
        () =>
            filters.vehicle != null
                ? ((vehicles.data ?? []).find(
                      (v) => v.id === filters.vehicle,
                  ) ?? null)
                : null,
        [filters.vehicle, vehicles.data],
    )

    // Status timeline / route endpoints are keyed by vehicle. Resolve it from the
    // selected live driver, or directly from a selected vehicle.
    const ribbonVehicleId =
        filters.vehicle ?? selectedDriver?.vehicle ?? null

    const mapMarkers = useMemo(() => {
        if (trackerImei) {
            const own = gpsMarkers.filter((m) => m.id === `gps-${trackerImei}`)
            const at = history.replay.position
            if (!at) return own
            const replayMarker: LiveMarker = {
                id: "replay",
                lat: at.lat,
                lng: at.lng,
                label: new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit" }).format(at.t),
                sub: `${Math.round(at.speed)} ${t("mon.units.kmh")}`,
                icon: "truck",
                tone: "loaded",
                course: at.course,
                selected: true,
            }
            return [replayMarker]
        }
        if (ribbonVehicleId != null) {
            const imeis = new Set(cargoItems.filter((g) => g.vehicle === ribbonVehicleId).map((g) => `gps-${g.imei}`))
            return gpsMarkers.filter((m) => imeis.has(String(m.id)))
        }
        return gpsMarkers
    }, [gpsMarkers, trackerImei, ribbonVehicleId, cargoItems, history.replay.position, t])

    const selectedDriverName = selectedDriver
        ? [selectedDriver.vehicle_number, selectedDriver.driver_name]
              .filter(Boolean)
              .join(" · ") || null
        : selectedVehicle
          ? [selectedVehicle.truck_number, selectedVehicle.driver_name]
                .filter(Boolean)
                .join(" · ") || null
          : null

    // Real GPS track for the status selected on the ribbon.
    const statusRoute = useGet<ApiStatusRoute>(MONITORING_STATUS_ROUTE, {
        params: {
            vehicle: ribbonVehicleId ?? undefined,
            status: activeStatus ?? undefined,
            from_date: filters.fromDate || undefined,
            to_date: filters.fromDate || undefined,
            max_points: 2000,
        },
        enabled:
            mode === "map" &&
            ribbonVehicleId != null &&
            activeStatus != null &&
            !!filters.fromDate,
    })

    // When a status is selected on the ribbon, highlight only that path on the map.
    const routeSegments = useMemo<ColoredPathSegment[] | undefined>(() => {
        if (activeStatus == null) return undefined
        const pts = statusRoute.data?.points
        if (!pts || pts.length < 2) return undefined
        const meta = STATUS_META[activeStatus]
        return [
            {
                points: pts,
                color: meta?.color ?? "#10b981",
                status: activeStatus,
            },
        ]
    }, [activeStatus, statusRoute.data])
    return {
        navigate,
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
        gpsLive,
        orders,
        trips,
        vehicles,
        polyline,
        polylineData,
        trackerImei,
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
        plateQuery,
        setPlateQuery,
        gpsItems,
        selectedTracker,
        replayStatuses,
        trackerHeaderVisible,
        replayBar,
        backToAll,
        ribbonDate,
        ribbonVehicleId,
        mapMarkers,
        selectedDriverName,
        routeSegments,
        panelTitle,
        selectOrder,
        selectTrip,
        selectVehicle,
    }
}
