import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    MONITORING_LIVE_TRACKING,
    MONITORING_ORDERS,
    MONITORING_ROUTES_POLYLINE,
    MONITORING_STATUS_ROUTE,
    MONITORING_STATUS_TIMELINE,
    MONITORING_TRIPS_TRACKING,
    MONITORING_VEHICLES,
    VEHICLES,
    MONITORING_GPS_LIVE,
    MONITORING_VEHICLE_LAST_ORDERS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { useNavigate, useSearch } from "@tanstack/react-router"
import {
    ArrowLeft,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Minimize2,
    RefreshCcw,
} from "lucide-react"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import ParamDateRange from "@/components/as-params/date-picker-range"
import DriverList from "./driver-list"
import { DimensionEmpty } from "./dimension-row"
import GpsList, { ConnectionFilterBar, NoGpsFilterButton, TruckStatusFilterBar, UnlinkedVehicles, type ConnectionFilter, type UnlinkedVehicle } from "./gps-list"
import { LastOrderCard, useVehicleLastOrder } from "./order-card"
import { useGpsLiveSocket } from "./gps-socket"
import { TrackerHeader, TrackerHistoryPanel, useTrackerHistory } from "./tracker-history"
import { ReplayMapControl } from "./route-replay"
import OrderList from "./order-list"
import RouteMap, { type LiveMarker, type MapBounds } from "./route-map"
import StatusReport from "./status"
import {
    type ApiStatusRoute,
    type ApiStatusSegment,
    type ColoredPathSegment,
    STATUS_META,
} from "./status/data"
import StatusRibbon from "./status-ribbon"
import TripList from "./trip-list"
import type {
    Dimension,
    LiveDriver,
    MonitoringFilters,
    OrderTracking,
    RoutePolyline,
    TripTracking,
    VehicleTracking,
    GpsLiveVehicle,
    VehicleLastOrders,
    TruckStatusFilter,
} from "./types"
import { EMPTY_FILTERS, TRUCK_STATUS_FILTERS, isHistoricalView, isRussiaTruck, todayIso, truckStatusOf } from "./types"
import VehicleList from "./vehicle-list"

const LIVE_REFRESH_MS = 30_000
const GPS_REFRESH_MS = 10_000
const GPS_FALLBACK_MS = 60_000

export default function MonitoringView() {
    const { t } = useTranslation()
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

    const num = (v: unknown): number | null => {
        if (v === undefined || v === null || v === "") return null
        const n = Number(v)
        return Number.isNaN(n) ? null : n
    }

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
    const [showOrderRoute, setShowOrderRoute] = useState(false)
    const history = useTrackerHistory(trackerImei)
    const lastOrders = useGet<VehicleLastOrders>(MONITORING_VEHICLE_LAST_ORDERS, {
        enabled: !historical,
        options: { staleTime: 60 * 1000, refetchInterval: 60 * 1000 },
    })
    const ordersByVehicle = useMemo(
        () => Object.fromEntries((lastOrders.data?.results ?? []).map((o) => [o.vehicle, o])),
        [lastOrders.data],
    )
    const truckStatus: TruckStatusFilter = TRUCK_STATUS_FILTERS.includes(search?.truck_status)
        ? search.truck_status
        : "all"
    const noGpsOnly = String(search?.nogps ?? "") === "1"
    const setNoGps = (on: boolean) =>
        patchSearch({ nogps: on ? "1" : undefined, truck_status: undefined, conn: undefined })
    const setTruckStatus = (next: TruckStatusFilter) =>
        patchSearch({ truck_status: next === "all" ? undefined : next, conn: undefined, nogps: undefined })
    const truckStatusCounts = useMemo(() => {
        const counts: Record<TruckStatusFilter, number> = { all: 0, loaded: 0, empty: 0, repair: 0 }
        for (const g of gpsLive.data ?? []) {
            counts.all += 1
            counts[truckStatusOf(g, g.vehicle != null ? ordersByVehicle[g.vehicle] : undefined)] += 1
        }
        return counts
    }, [gpsLive.data, ordersByVehicle])
    const connection: ConnectionFilter =
        search?.conn === "online" || search?.conn === "offline" ? search.conn : "all"
    const setConnection = (next: ConnectionFilter) =>
        patchSearch({ conn: next === "all" ? undefined : next, truck_status: undefined, nogps: undefined })
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
        setShowOrderRoute(false)
        setTrackerImei(imei)
    }

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
                        ? `${Math.round(g.speed)} km/h`
                        : g.driver_name ?? undefined,
                stale: g.status !== "online",
                icon: "truck" as const,
                tone: truckStatusOf(g, g.vehicle != null ? ordersByVehicle[g.vehicle] : undefined),
                russia: isRussiaTruck(g),
                course: g.course,
                selected: g.imei === trackerImei,
                onClick: () => selectTracker(g.imei),
            }))
    }, [cargoItems, historical, trackerImei, ordersByVehicle])

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
                    label: `Order #${o.id}`,
                    sub: o.driver_name ?? o.vehicle_number ?? undefined,
                    stale:
                        o.seconds_since == null || o.seconds_since > 5 * 60,
                    onClick: () => selectOrder(o),
                }))
        }
        if (dimension === "trip") {
            return (trips.data ?? [])
                .filter((t) => t.lat != null && t.lng != null)
                .map((t) => ({
                    id: t.id,
                    lat: t.lat as number,
                    lng: t.lng as number,
                    label: `Reys #${t.id}`,
                    sub: t.driver_name ?? t.vehicle_number ?? undefined,
                    stale:
                        t.seconds_since == null || t.seconds_since > 5 * 60,
                    onClick: () => selectTrip(t),
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
    })
    const replayStatuses = useMemo(
        () =>
            (replayTimeline.data ?? []).map((s) => ({
                status: s.status,
                start: Date.parse(s.start),
                end: Date.parse(s.end),
                order: (s as { order_id?: number | null }).order_id ?? null,
                from: (s as { from_place?: string | null }).from_place ?? null,
                to: (s as { to_place?: string | null }).to_place ?? null,
            })),
        [replayTimeline.data],
    )
    const setHistoryStatuses = history.setStatusSegments
    useEffect(() => {
        setHistoryStatuses(replayStatuses)
    }, [replayStatuses, setHistoryStatuses])
    const lastOrder = useVehicleLastOrder(selectedTracker?.vehicle ?? null)
    const trackerHeaderVisible =
        mode === "map" && !historical && dimension === "driver" && selectedTracker != null
    const trackerMap = showOrderRoute ? lastOrder.map : null
    const replayBar = mode === "map" && !!trackerImei && !trackerMap && history.replay.points.length >= 2
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
                sub: `${Math.round(at.speed)} km/h`,
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
    }, [gpsMarkers, trackerImei, ribbonVehicleId, cargoItems, history.replay.position])

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

    return (
        <div className="flex flex-col gap-3">
            {mode === "report" && (
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-semibold">{t("table.status")}</h1>
                {mode === "report" && (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <ParamDateRange
                            from="from_date"
                            to="to_date"
                            clearable={false}
                            defaultValue={{
                                from: startOfMonth(new Date()),
                                to: endOfMonth(new Date()),
                            }}
                            addButtonProps={{
                                className:
                                    "!bg-muted/50 h-8 text-xs min-w-28 justify-start",
                            }}
                        />
                    </div>
                )}
            </div>
            )}

            {/* One persistent grid: the map collapses + fades while the panel
                track grows from sidebar-width to full — a true expand, not a
                crossfade of two separate trees. Only the panel's inner content
                swaps between the live lists and the status report. */}
            <div
                className={cn(
                    "relative grid grid-cols-1 gap-3 transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    mode === "report"
                        ? "lg:grid-cols-[minmax(0,0fr)_minmax(320px,1fr)]"
                        : panelOpen
                          ? "lg:grid-cols-[minmax(0,4fr)_minmax(280px,1fr)]"
                          : "lg:grid-cols-[minmax(0,1fr)_minmax(0,0fr)]",
                )}
            >
                {mode === "map" && (
                    <button
                        type="button"
                        onClick={() => setPanelOpen((v) => !v)}
                        aria-label={panelTitle}
                        title={panelTitle}
                        className={cn(
                            "absolute top-1/2 z-20 hidden h-16 w-6 -translate-y-1/2 items-center justify-center rounded-md border border-primary bg-primary text-primary-foreground shadow-lg shadow-black/30 transition-[right,color,background-color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:brightness-110 lg:flex",
                            panelOpen
                                ? "right-[calc(max(280px,(100%_-_12px)/5)_-_6px)]"
                                : "right-[-6px]",
                        )}
                    >
                        {panelOpen ? (
                            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                        ) : (
                            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                        )}
                    </button>
                )}
                <div
                    className={cn(
                        "min-w-0 overflow-hidden transition-opacity duration-500",
                        mode === "report"
                            ? "pointer-events-none hidden opacity-0 lg:block"
                            : "opacity-100",
                    )}
                >
                    <Card className="relative overflow-hidden">
                        <CardContent className="relative p-0">
                            {!historical && !trackerImei && (gpsLive.data?.length ?? 0) > 0 && (
                                <div className="absolute left-3 right-3 top-3 z-[500] flex flex-wrap items-start gap-2 pointer-events-none [&>*]:pointer-events-auto [&>*]:max-w-full [&>*]:overflow-x-auto">
                                    <TruckStatusFilterBar
                                        value={noGpsOnly || connection !== "all" ? ("none" as TruckStatusFilter) : truckStatus}
                                        onChange={setTruckStatus}
                                        counts={truckStatusCounts}
                                        extra={
                                            <>
                                                <ConnectionFilterBar
                                                    bare
                                                    value={noGpsOnly ? "all" : connection}
                                                    onChange={setConnection}
                                                    counts={connectionCounts}
                                                />
                                                {allUnlinked.length > 0 && (
                                                    <NoGpsFilterButton
                                                        active={noGpsOnly}
                                                        count={allUnlinked.length}
                                                        onToggle={() => setNoGps(!noGpsOnly)}
                                                    />
                                                )}
                                            </>
                                        }
                                    />
                                </div>
                            )}
                            {mode === "map" && (trackerImei || selectedId != null) && (
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute left-3 top-3 z-[500] h-10 w-10 shadow-md"
                                    onClick={backToAll}
                                    aria-label={t("page.back_to_list")}
                                    title={t("page.back_to_list")}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            )}
                            {mode === "map" && trackerImei && !trackerMap && (
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className={cn(
                                        "absolute left-3 top-[60px] z-[500] h-10 w-10 font-mono text-base font-bold shadow-md",
                                        history.showStops
                                            ? "bg-amber-500 text-amber-950 hover:bg-amber-400"
                                            : "text-muted-foreground",
                                    )}
                                    onClick={() => history.setShowStops(!history.showStops)}
                                    aria-pressed={history.showStops}
                                    aria-label="To'xtashlarni ko'rsatish"
                                    title="To'xtashlarni ko'rsatish"
                                >
                                    P
                                </Button>
                            )}
                            {replayBar && (
                                <ReplayMapControl
                                    replay={history.replay}
                                    statuses={replayStatuses}
                                    focusKey={history.focus?.kind === "status" ? history.focus.key : null}
                                    onFocus={(key) => history.setFocus(key ? { kind: "status", key } : null)}
                                    className="absolute left-16 right-3 top-3 z-[500]"
                                />
                            )}
                            <RouteMap
                                height="calc(100vh - 112px)"
                                markers={mapMarkers}
                                onBoundsChange={setMapBounds}
                                segments={
                                    trackerImei
                                        ? (trackerMap?.segments ?? history.map.segments)
                                        : historical
                                          ? routeSegments
                                          : undefined
                                }
                                points={
                                    trackerImei
                                        ? (trackerMap?.points ?? history.map.points)
                                        : historical
                                          ? polylineData?.points
                                          : undefined
                                }
                                bbox={
                                    trackerImei
                                        ? (trackerMap ? trackerMap.bbox : history.map.bbox)
                                        : historical
                                          ? (polylineData?.bbox ?? null)
                                          : null
                                }
                                pois={trackerImei && !trackerMap ? history.map.pois : undefined}
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card
                    className={cn(
                        "flex h-full max-h-[calc(100vh-112px)] min-w-0 flex-col transition-opacity duration-500",
                        mode === "map" &&
                            !panelOpen &&
                            "lg:pointer-events-none lg:invisible lg:overflow-hidden lg:border-0 lg:opacity-0",
                    )}
                >
                    {(mode === "report" || historical || selectedId != null || trackerHeaderVisible) && (
                    <CardHeader className={cn("flex flex-row items-center justify-between gap-2 py-3", trackerHeaderVisible && "mb-4 border-b-2 border-muted-foreground/60")}>
                        {trackerHeaderVisible ? (
                            <TrackerHeader tracker={selectedTracker} onBack={() => selectTracker(null)} />
                        ) : (
                        <div className="flex min-w-0 items-center gap-2">
                            {mode === "map" && selectedId != null && (
                                <button
                                    type="button"
                                    onClick={() => setFilters(EMPTY_FILTERS)}
                                    aria-label={t("page.back_to_list")}
                                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                </button>
                            )}
                            {(mode === "report" || historical || selectedId != null) && (
                                <CardTitle className="truncate text-sm font-semibold">
                                    {mode === "report"
                                        ? t("table.orders_history")
                                        : selectedId != null && selectedDriverName
                                          ? selectedDriverName
                                          : panelTitle}
                                </CardTitle>
                            )}
                        </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            {mode === "report" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setMode(
                                            mode === "report"
                                                ? "map"
                                                : "report",
                                        )
                                    }
                                    aria-label={
                                        mode === "report"
                                            ? t("actions.cancel")
                                            : t("page.details")
                                    }
                                    className={cn(
                                        "group grid h-7 w-7 place-items-center rounded-md border transition-colors",
                                        mode === "report"
                                            ? "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                            : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20",
                                    )}
                                >
                                    {mode === "report" ? (
                                        <Minimize2 className="h-3.5 w-3.5" />
                                    ) : (
                                        <Maximize2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                                    )}
                                </button>
                            )}
                        </div>
                    </CardHeader>
                    )}
                    <CardContent className={cn("flex-1", trackerHeaderVisible ? "flex min-h-0 flex-col overflow-hidden" : "overflow-auto", mode === "report" || historical || selectedId != null || trackerHeaderVisible ? "pt-0" : "pt-4")}>
                        {mode === "report" ? (
                            <StatusReport onSelectOnMap={selectFromStatus} />
                        ) : historical ? (
                            <HistoricalSummary
                                data={polylineData}
                                loading={polyline.isLoading}
                                onOpenTrip={(id) =>
                                    navigate({
                                        to: "/monitoring/trips/$id",
                                        params: { id: String(id) },
                                    })
                                }
                            />
                        ) : dimension === "driver" ? (
                            // Hozircha faqat gps-backend trekerlari. Eski ro'yxat:
                            // <DriverList items={liveDrivers} loading={drivers.isLoading}
                            //     activeId={filters.driver} onSelect={selectDriver} />
                            selectedTracker ? (
                                <TrackerHistoryPanel history={history}>
                                    {selectedTracker.vehicle != null && (
                                        <LastOrderCard
                                            lastOrder={lastOrder}
                                            showRoute={showOrderRoute}
                                            onToggleRoute={() => setShowOrderRoute((v) => !v)}
                                        />
                                    )}
                                </TrackerHistoryPanel>
                            ) : (
                                <>
                                {noGpsOnly ? (
                                    <UnlinkedVehicles items={allUnlinked} />
                                ) : (truckStatus !== "all" || connection !== "all") && cargoItems.length === 0 && gpsItems.length > 0 ? (
                                    <DimensionEmpty title={t("page.not_found")} />
                                ) : (
                                <>
                                {visibleItems.length < cargoItems.length && (
                                    <div className="mb-2 flex items-center justify-between gap-2 rounded-md bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
                                        <span>Xaritadagi hudud</span>
                                        <span className="font-mono font-semibold tabular-nums text-foreground">
                                            {visibleItems.length} / {cargoItems.length}
                                        </span>
                                    </div>
                                )}
                                <GpsList
                                    items={visibleItems}
                                    loading={gpsLive.isLoading}
                                    unavailable={gpsLive.isError}
                                    orders={ordersByVehicle}
                                    activeImei={trackerImei}
                                    onSelect={(item) => selectTracker(item.imei)}
                                    unlinked={unlinkedVehicles}
                                />
                                </>
                                )}
                                </>
                            )
                        ) : dimension === "order" ? (
                            <OrderList
                                items={orders.data ?? []}
                                loading={orders.isLoading}
                                activeId={filters.order}
                                onSelect={selectOrder}
                            />
                        ) : dimension === "trip" ? (
                            <TripList
                                items={trips.data ?? []}
                                loading={trips.isLoading}
                                activeId={filters.trip}
                                onSelect={selectTrip}
                            />
                        ) : (
                            <VehicleList
                                items={vehicles.data ?? []}
                                loading={vehicles.isLoading}
                                activeId={filters.vehicle}
                                onSelect={selectVehicle}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {mode === "map" && ribbonVehicleId != null && ribbonDate && (
                <StatusRibbon
                    vehicleId={ribbonVehicleId}
                    vehicleLabel={selectedDriverName}
                    date={ribbonDate}
                    active={activeStatus}
                    onToggle={toggleStatus}
                />
            )}

            {mode === "map" &&
                historical &&
                polylineData &&
                polylineData.count > 0 && <StatStrip data={polylineData} />}
        </div>
    )
}

// "YYYY-MM-DD" → local Date (avoids the UTC shift of `new Date(str)`).
function parseLocalDate(raw: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
    if (!m) return null
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

function HistoricalSummary({
    data,
    loading,
    onOpenTrip,
}: {
    data: RoutePolyline | undefined
    loading?: boolean
    onOpenTrip?: (tripId: number) => void
}) {
    const { t } = useTranslation()
    if (loading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-12 animate-pulse rounded-md bg-muted/40"
                    />
                ))}
            </div>
        )
    }
    if (!data) {
        return (
            <div className="py-10 text-center text-sm text-muted-foreground">
                {t("page.not_found")}
            </div>
        )
    }
    if (data.count === 0) {
        return (
            <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                    {t("page.no_gps")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                    {data.latest_at
                        ? `${formatStamp(data.latest_at)}`
                        : t("page.no_data_period")}
                </p>
            </div>
        )
    }

    const km = (data.distance_m / 1000).toFixed(2)
    const durMin = durationMinutes(data.first_at, data.last_at)

    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
                <Stat label={t("form.distance")} value={km} unit="km" />
                <Stat
                    label={t("table.duration")}
                    value={durMin != null ? String(durMin) : "—"}
                    unit={durMin != null ? "min" : undefined}
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Row label={t("table.start_time")} value={formatStamp(data.first_at)} />
                <Row label={t("table.end_time")} value={formatStamp(data.last_at)} />
            </div>

            {data.trip != null && onOpenTrip && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenTrip(data.trip!)}
                    className="mt-1 w-full justify-between"
                >
                    <span>{t("page.trip_list")} · #{data.trip}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    )
}

function Stat({
    label,
    value,
    unit,
    big,
}: {
    label: string
    value: string
    unit?: string
    big?: boolean
}) {
    return (
        <div className="rounded-md border bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-0.5 flex items-baseline gap-1">
                <span
                    className={cn(
                        "font-semibold tabular-nums",
                        big ? "text-2xl" : "text-base",
                    )}
                >
                    {value}
                </span>
                {unit && (
                    <span className="text-xs text-muted-foreground">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    )
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-muted/20 px-3 py-1.5">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="truncate text-sm font-medium tabular-nums">
                {value}
            </div>
        </div>
    )
}

function StatStrip({ data }: { data: RoutePolyline }) {
    const { t } = useTranslation()
    return (
        <div className="flex flex-wrap gap-2">
            {data.trip != null && (
                <Pill label={t("page.trips")} value={`#${data.trip}`} />
            )}
            {data.order != null && (
                <Pill label="Order" value={`#${data.order}`} />
            )}
        </div>
    )
}

function Pill({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold tabular-nums">{value}</span>
        </div>
    )
}

function formatStamp(raw: string | null): string {
    if (!raw) return "—"
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return raw
    return format(d, "dd/MM HH:mm")
}

function durationMinutes(from: string | null, to: string | null): number | null {
    if (!from || !to) return null
    const a = new Date(from).getTime()
    const b = new Date(to).getTime()
    if (Number.isNaN(a) || Number.isNaN(b)) return null
    return Math.max(0, Math.round((b - a) / 60000))
}
