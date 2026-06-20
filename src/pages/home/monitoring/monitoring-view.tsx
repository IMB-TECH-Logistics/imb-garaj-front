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
    MONITORING_TRIPS_TRACKING,
    MONITORING_VEHICLES,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { useNavigate, useSearch } from "@tanstack/react-router"
import {
    ArrowLeft,
    ArrowUpRight,
    Maximize2,
    Minimize2,
    RefreshCcw,
} from "lucide-react"
import { endOfMonth, startOfMonth } from "date-fns"
import { useMemo } from "react"
import ParamDateRange from "@/components/as-params/date-picker-range"
import DriverList from "./driver-list"
import MonitoringFilterBar from "./filter-bar"
import OrderList from "./order-list"
import RouteMap, { type LiveMarker } from "./route-map"
import StatusReport from "./status"
import {
    type ApiStatusRoute,
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
} from "./types"
import { EMPTY_FILTERS, isHistoricalView, todayIso } from "./types"
import VehicleList from "./vehicle-list"

const LIVE_REFRESH_MS = 30_000

export default function MonitoringView() {
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
            toDate: "",
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
                    label: d.vehicle_number ?? d.driver_name ?? `#${d.user}`,
                    sub: d.driver_name ?? undefined,
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

    const panelTitle = historical
        ? "Marshrut sharhi"
        : ({
              driver: "Faol avtomobillar",
              order: "Faol orderlar",
              trip: "Faol reyslar",
              vehicle: "Faol moshinalar",
          } as const)[dimension]

    const freshCount =
        dimension === "driver"
            ? liveDrivers.filter((d) => d.seconds_since <= 5 * 60).length
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
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-xl font-semibold">
                        {mode === "report" ? "Status hisoboti" : "Monitoring"}
                    </h1>
                    {mode === "map" &&
                        (freshCount != null ? (
                            <Badge variant="secondary">
                                Onlayn · {freshCount} / {liveDrivers.length}
                            </Badge>
                        ) : (
                            <Badge variant="secondary">
                                {activeList.data?.length ?? 0} ta
                            </Badge>
                        ))}
                </div>
                {mode === "map" && (
                    <div className="flex items-center gap-2">
                        <MonitoringFilterBar
                            value={filters}
                            onChange={setFilters}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            aria-label="Yangilash"
                            className="h-9 w-9 shrink-0"
                        >
                            <RefreshCcw
                                className={cn(
                                    "h-4 w-4",
                                    refreshing && "animate-spin",
                                )}
                            />
                        </Button>
                    </div>
                )}
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

            {/* One persistent grid: the map collapses + fades while the panel
                track grows from sidebar-width to full — a true expand, not a
                crossfade of two separate trees. Only the panel's inner content
                swaps between the live lists and the status report. */}
            <div
                className={cn(
                    "grid grid-cols-1 gap-3 transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    mode === "report"
                        ? "lg:grid-cols-[0fr_1fr]"
                        : "lg:grid-cols-[5fr_2fr]",
                )}
            >
                <div
                    className={cn(
                        "min-w-0 overflow-hidden transition-opacity duration-500",
                        mode === "report"
                            ? "pointer-events-none hidden opacity-0 lg:block"
                            : "opacity-100",
                    )}
                >
                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            <RouteMap
                                height="calc(100vh - 200px)"
                                markers={liveMarkers}
                                segments={routeSegments}
                                points={
                                    historical
                                        ? polylineData?.points
                                        : undefined
                                }
                                bbox={
                                    historical
                                        ? (polylineData?.bbox ?? null)
                                        : null
                                }
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card className="flex h-full max-h-[calc(100vh-200px)] min-w-0 flex-col">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                            {mode === "map" && selectedId != null && (
                                <button
                                    type="button"
                                    onClick={() => setFilters(EMPTY_FILTERS)}
                                    aria-label="Ro'yxatga qaytish"
                                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                </button>
                            )}
                            <CardTitle className="truncate text-sm font-semibold">
                                {mode === "report"
                                    ? "Avtomobillar holati"
                                    : selectedId != null && selectedDriverName
                                      ? selectedDriverName
                                      : panelTitle}
                            </CardTitle>
                            {mode === "map" &&
                                !historical &&
                                activeList.data && (
                                    <Badge
                                        variant="outline"
                                        className="shrink-0"
                                    >
                                        {activeList.data.length}
                                    </Badge>
                                )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            {/* Hide expand while an avtomobil is selected — the
                                back button takes priority there. */}
                            {!(mode === "map" && selectedId != null) && (
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
                                            ? "Kichraytirish"
                                            : "Kengaytirish"
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
                    <CardContent className="flex-1 overflow-auto pt-0">
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
    const durMin = durationMinutes(data.first_at, data.last_at)

    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
                <Stat label="Masofa" value={km} unit="km" />
                <Stat
                    label="Davomiyligi"
                    value={durMin != null ? String(durMin) : "—"}
                    unit={durMin != null ? "min" : undefined}
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Row label="Boshlanish" value={formatStamp(data.first_at)} />
                <Row label="Tugash" value={formatStamp(data.last_at)} />
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
    return (
        <div className="flex flex-wrap gap-2">
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

function durationMinutes(from: string | null, to: string | null): number | null {
    if (!from || !to) return null
    const a = new Date(from).getTime()
    const b = new Date(to).getTime()
    if (Number.isNaN(a) || Number.isNaN(b)) return null
    return Math.max(0, Math.round((b - a) / 60000))
}
