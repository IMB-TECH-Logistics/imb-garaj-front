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
    MONITORING_TRIPS_TRACKING,
    MONITORING_VEHICLES,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import {
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    RefreshCcw,
} from "lucide-react"
import { useMemo, useState } from "react"
import DimensionTabs from "./dimension-tabs"
import DriverList from "./driver-list"
import MonitoringFilterBar from "./filter-bar"
import OrderList from "./order-list"
import RouteMap, { type LiveMarker } from "./route-map"
import TripList from "./trip-list"
import type {
    Dimension,
    LiveDriver,
    MonitoringFilters,
    OrderTracking,
    RoutePolyline,
    TripTracking,
    VehicleTracking,
} from "./types"
import { EMPTY_FILTERS, isHistoricalView, todayIso } from "./types"
import VehicleList from "./vehicle-list"

const LIVE_REFRESH_MS = 30_000

export default function MonitoringView() {
    const navigate = useNavigate()
    const [dimension, setDimension] = useState<Dimension>("driver")
    const [filters, setFilters] = useState<MonitoringFilters>(EMPTY_FILTERS)
    const [panelOpen, setPanelOpen] = useState(true)

    const historical = isHistoricalView(filters)
    const selectedId =
        filters.driver ?? filters.order ?? filters.trip ?? filters.vehicle

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

    const liveMarkers: LiveMarker[] = useMemo(() => {
        if (historical) return []
        if (dimension === "driver") {
            return liveDrivers
                .filter((d) => d.lat != null && d.lng != null)
                .map((d) => ({
                    id: d.user,
                    lat: d.lat as number,
                    lng: d.lng as number,
                    label: d.driver_name || `Driver #${d.user}`,
                    sub: d.vehicle_number ?? undefined,
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

    const counts: Partial<Record<Dimension, number>> = {
        driver: drivers.data?.length,
        order: orders.data?.length,
        trip: trips.data?.length,
        vehicle: vehicles.data?.length,
    }

    const panelTitle = historical
        ? "Marshrut sharhi"
        : ({
              driver: "Faol haydovchilar",
              order: "Faol orderlar",
              trip: "Faol reyslar",
              vehicle: "Faol moshinalar",
          } as const)[dimension]

    const freshCount =
        dimension === "driver"
            ? liveDrivers.filter((d) => d.seconds_since <= 5 * 60).length
            : null

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-xl font-semibold">Monitoring</h1>
                    {historical ? (
                        <Badge variant="secondary">Tarixiy ko'rinish</Badge>
                    ) : freshCount != null ? (
                        <Badge variant="secondary">
                            Onlayn · {freshCount} / {liveDrivers.length}
                        </Badge>
                    ) : (
                        <Badge variant="secondary">
                            {activeList.data?.length ?? 0} ta
                        </Badge>
                    )}
                    <DimensionTabs
                        value={dimension}
                        onChange={setDimension}
                        counts={counts}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <MonitoringFilterBar
                        value={filters}
                        onChange={setFilters}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="gap-1.5"
                        icon={
                            <RefreshCcw
                                className={cn(
                                    "h-3.5 w-3.5",
                                    refreshing && "animate-spin",
                                )}
                            />
                        }
                    >
                        Yangilash
                    </Button>
                </div>
            </div>

            <div
                className={cn(
                    "grid grid-cols-1 gap-3 transition-[grid-template-columns] duration-300",
                    panelOpen
                        ? "lg:grid-cols-[1fr_340px]"
                        : "lg:grid-cols-[1fr_0px]",
                )}
            >
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                        <RouteMap
                            height="calc(100vh - 200px)"
                            markers={liveMarkers}
                            points={
                                historical ? polylineData?.points : undefined
                            }
                            bbox={
                                historical
                                    ? (polylineData?.bbox ?? null)
                                    : null
                            }
                        />
                    </CardContent>
                </Card>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setPanelOpen((v) => !v)}
                        aria-label={
                            panelOpen
                                ? "Panelni yopish"
                                : "Panelni ochish"
                        }
                        className="absolute -left-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full border bg-background shadow-sm transition hover:bg-muted"
                    >
                        {panelOpen ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </button>

                    <div
                        className={cn(
                            "h-full overflow-hidden transition-[opacity,transform] duration-300",
                            panelOpen
                                ? "opacity-100 translate-x-0"
                                : "pointer-events-none opacity-0 translate-x-3",
                        )}
                    >
                        <Card className="flex h-full max-h-[calc(100vh-200px)] flex-col">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                                <CardTitle className="text-sm font-semibold">
                                    {panelTitle}
                                </CardTitle>
                                {!historical && activeList.data && (
                                    <Badge variant="outline">
                                        {activeList.data.length}
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto pt-0">
                                {historical ? (
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
                                    <DriverList
                                        items={liveDrivers}
                                        loading={drivers.isLoading}
                                        activeId={filters.driver}
                                        onSelect={selectDriver}
                                    />
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
                </div>
            </div>

            {historical && polylineData && polylineData.count > 0 && (
                <StatStrip data={polylineData} />
            )}
        </div>
    )
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
                Filtr asosida ma'lumot topilmadi.
            </div>
        )
    }
    if (data.count === 0) {
        return (
            <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                    Bu davr uchun GPS yozuvi yo'q
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                    Boshqa filtr yoki sana oralig'ini sinab ko'ring
                </p>
            </div>
        )
    }

    const km = (data.distance_m / 1000).toFixed(2)

    return (
        <div className="flex flex-col gap-3">
            <Stat label="Masofa" value={km} unit="km" big />

            <div className="grid grid-cols-1 gap-2">
                <Row label="Boshlanish" value={formatStamp(data.first_at)} />
                <Row label="Tugash" value={formatStamp(data.last_at)} />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Row label="Nuqtalar" value={data.count.toLocaleString()} />
                <Row
                    label="Davomiyligi"
                    value={formatDuration(data.first_at, data.last_at)}
                />
            </div>

            {data.trip != null && onOpenTrip && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenTrip(data.trip!)}
                    className="mt-1 w-full justify-between"
                >
                    <span>Reys batafsil · #{data.trip}</span>
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
    const km = (data.distance_m / 1000).toFixed(2)
    return (
        <div className="flex flex-wrap gap-2">
            <Pill label="Masofa" value={`${km} km`} />
            <Pill label="Nuqtalar" value={data.count.toLocaleString()} />
            <Pill
                label="Davomiyligi"
                value={formatDuration(data.first_at, data.last_at)}
            />
            {data.trip != null && (
                <Pill label="Reys" value={`#${data.trip}`} />
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
    return d.toLocaleString("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function formatDuration(from: string | null, to: string | null): string {
    if (!from || !to) return "—"
    const a = new Date(from).getTime()
    const b = new Date(to).getTime()
    if (Number.isNaN(a) || Number.isNaN(b)) return "—"
    const seconds = Math.max(0, Math.floor((b - a) / 1000))
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h === 0) return `${m}m`
    return `${h}s ${m}m`
}
