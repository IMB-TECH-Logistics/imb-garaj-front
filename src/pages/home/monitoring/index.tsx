import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    MONITORING_LIVE_TRACKING,
    MONITORING_ROUTES_POLYLINE,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import { ArrowUpRight, RefreshCcw } from "lucide-react"
import { useMemo, useState } from "react"
import MonitoringFilterBar, { type MonitoringFilters } from "./filter-bar"
import LiveDriverList from "./live-list"
import RouteMap, { type LiveMarker } from "./route-map"
import type { LiveDriver, RoutePolyline } from "./types"

const LIVE_REFRESH_MS = 30_000

export default function MonitoringPage() {
    const navigate = useNavigate()
    const [filters, setFilters] = useState<MonitoringFilters>({
        driver: null,
        trip: null,
        fromDate: "",
        toDate: "",
    })
    const [selectedUser, setSelectedUser] = useState<number | null>(null)

    const hasHistoricalFilter =
        filters.trip != null ||
        filters.driver != null ||
        !!filters.fromDate ||
        !!filters.toDate

    const live = useGet<LiveDriver[]>(MONITORING_LIVE_TRACKING, {
        options: {
            refetchInterval: LIVE_REFRESH_MS,
            refetchIntervalInBackground: false,
        },
        enabled: !hasHistoricalFilter,
    })

    const polyline = useGet<RoutePolyline>(MONITORING_ROUTES_POLYLINE, {
        params: {
            ...(filters.trip ? { trip: filters.trip } : {}),
            ...(filters.driver ? { driver: filters.driver } : {}),
            ...(filters.fromDate ? { from_date: filters.fromDate } : {}),
            ...(filters.toDate ? { to_date: filters.toDate } : {}),
            max_points: 2000,
        },
        enabled: hasHistoricalFilter,
    })

    const liveDrivers = useMemo<LiveDriver[]>(
        () =>
            (live.data ?? []).map((d) => ({
                ...d,
                lat: d.lng,
                lng: d.lat,
            })),
        [live.data],
    )
    const freshCount = liveDrivers.filter((d) => d.seconds_since <= 5 * 60).length

    const polylineData = useMemo<RoutePolyline | undefined>(() => {
        if (!polyline.data) return polyline.data
        return {
            ...polyline.data,
            points: polyline.data.points?.map(
                ([a, b]) => [b, a] as [number, number],
            ),
            bbox: polyline.data.bbox
                ? ([
                      polyline.data.bbox[1],
                      polyline.data.bbox[0],
                      polyline.data.bbox[3],
                      polyline.data.bbox[2],
                  ] as [number, number, number, number])
                : null,
        }
    }, [polyline.data])

    const liveMarkers: LiveMarker[] = liveDrivers.map((d) => ({
        id: d.user,
        lat: d.lat,
        lng: d.lng,
        label: d.driver_name || `Driver #${d.user}`,
        sub: d.vehicle_number ?? undefined,
        stale: d.seconds_since > 5 * 60,
        selected: selectedUser === d.user,
        onClick: () => setSelectedUser(d.user),
    }))

    const refreshing = hasHistoricalFilter
        ? polyline.isFetching
        : live.isFetching

    const handleRefresh = () =>
        hasHistoricalFilter ? polyline.refetch() : live.refetch()

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold">Monitoring</h1>
                    {hasHistoricalFilter ? (
                        <Badge variant="secondary">Tarixiy ko'rinish</Badge>
                    ) : (
                        <Badge variant="secondary">
                            Onlayn · {freshCount} / {liveDrivers.length}
                        </Badge>
                    )}
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

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_320px]">
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                        <RouteMap
                            height="calc(100vh - 200px)"
                            markers={hasHistoricalFilter ? [] : liveMarkers}
                            points={
                                hasHistoricalFilter
                                    ? polylineData?.points
                                    : undefined
                            }
                            bbox={
                                hasHistoricalFilter
                                    ? (polylineData?.bbox ?? null)
                                    : null
                            }
                        />
                    </CardContent>
                </Card>

                <Card className="flex max-h-[calc(100vh-200px)] flex-col">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                        <CardTitle className="text-sm font-semibold">
                            {hasHistoricalFilter
                                ? "Reys sharhi"
                                : "Faol haydovchilar"}
                        </CardTitle>
                        {!hasHistoricalFilter && (
                            <Badge variant="outline">
                                {liveDrivers.length}
                            </Badge>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto pt-0">
                        {hasHistoricalFilter ? (
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
                        ) : (
                            <LiveDriverList
                                items={liveDrivers}
                                loading={live.isLoading}
                                activeUserId={selectedUser}
                                onSelect={(d) => setSelectedUser(d.user)}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {hasHistoricalFilter && polylineData && polylineData.count > 0 && (
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
                <Row
                    label="Boshlanish"
                    value={formatStamp(data.first_at)}
                />
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
