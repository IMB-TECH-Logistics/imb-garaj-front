import { Button } from "@/components/ui/button"
import {
    MONITORING_LIVE_TRACKING,
    MONITORING_ROUTES_POLYLINE,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import { Activity, ArrowUpRight, RefreshCcw } from "lucide-react"
import { useState } from "react"
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

    const liveDrivers = live.data ?? []
    const freshCount = liveDrivers.filter((d) => d.seconds_since <= 5 * 60).length

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
        <div className="-m-4 -mt-20 flex h-screen flex-col bg-slate-50 pt-20 dark:bg-slate-950">
            {/* HEADER */}
            <header className="relative z-20 flex items-center justify-between border-b border-border/60 bg-background/85 px-5 py-3 backdrop-blur-xl">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                        <h1 className="text-base font-semibold leading-tight tracking-tight">
                            Monitoring
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {hasHistoricalFilter ? (
                                <>
                                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    <span>Tarixiy ko'rinish</span>
                                </>
                            ) : (
                                <>
                                    <span className="relative inline-flex h-1.5 w-1.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70" />
                                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    </span>
                                    <span>
                                        Onlayn ·{" "}
                                        <span className="font-mono tabular-nums">
                                            {freshCount}
                                        </span>{" "}
                                        / {liveDrivers.length} aktiv
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <MonitoringFilterBar
                        value={filters}
                        onChange={setFilters}
                    />
                    <div className="mx-1 hidden h-6 w-px bg-border lg:block" />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="h-8 gap-1.5"
                    >
                        <RefreshCcw
                            className={cn(
                                "h-3.5 w-3.5",
                                refreshing && "animate-spin",
                            )}
                        />
                        Yangilash
                    </Button>
                </div>
            </header>

            {/* MAP CANVAS */}
            <div className="relative flex-1 overflow-hidden">
                <RouteMap
                    height="100%"
                    className="absolute inset-0"
                    markers={hasHistoricalFilter ? [] : liveMarkers}
                    points={
                        hasHistoricalFilter ? polyline.data?.points : undefined
                    }
                    bbox={
                        hasHistoricalFilter
                            ? (polyline.data?.bbox ?? null)
                            : null
                    }
                />

                {/* Right glass panel */}
                <aside className="pointer-events-none absolute top-4 right-4 bottom-4 z-10 flex w-[320px] flex-col">
                    <div className="pointer-events-auto flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-background/85 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
                        <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-background/40 px-4 py-2.5">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                {hasHistoricalFilter
                                    ? "Reys sharhi"
                                    : "Faol haydovchilar"}
                            </span>
                            {!hasHistoricalFilter && (
                                <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">
                                    {liveDrivers.length}
                                </span>
                            )}
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto p-3">
                            {hasHistoricalFilter ? (
                                <HistoricalSummary
                                    data={polyline.data}
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
                        </div>
                    </div>
                </aside>

                {/* Bottom-left stat strip (historical only) */}
                {hasHistoricalFilter && polyline.data && polyline.data.count > 0 && (
                    <StatStrip data={polyline.data} />
                )}
            </div>
        </div>
    )
}

// ─── Historical summary panel ───────────────────────────────────────

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
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                    Boshqa filtr yoki sana oralig'ini sinab ko'ring
                </p>
            </div>
        )
    }

    const km = (data.distance_m / 1000).toFixed(2)

    return (
        <div className="flex flex-col gap-3">
            <Stat label="Masofa" value={`${km}`} unit="km" big />

            <div className="grid grid-cols-1 gap-2">
                <TimelineRow
                    label="Boshlanish"
                    value={formatStamp(data.first_at)}
                    variant="start"
                />
                <TimelineRow
                    label="Tugash"
                    value={formatStamp(data.last_at)}
                    variant="end"
                />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
                <MicroStat label="Nuqtalar" value={data.count.toLocaleString()} />
                <MicroStat label="Davomiyligi" value={formatDuration(data.first_at, data.last_at)} />
            </div>

            {data.trip != null && onOpenTrip && (
                <button
                    type="button"
                    onClick={() => onOpenTrip(data.trip!)}
                    className="group mt-2 inline-flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
                >
                    <span className="inline-flex items-center gap-1.5">
                        Reys batafsil
                        <span className="font-mono text-muted-foreground">
                            #{data.trip}
                        </span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
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
        <div className="rounded-lg border border-border/60 bg-card/60 px-3 py-2.5">
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {label}
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
                <span
                    className={cn(
                        "font-mono tabular-nums text-foreground",
                        big ? "text-2xl font-bold" : "text-base font-semibold",
                    )}
                >
                    {value}
                </span>
                {unit && (
                    <span className="text-xs text-muted-foreground">{unit}</span>
                )}
            </div>
        </div>
    )
}

function MicroStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md bg-muted/40 px-2.5 py-1.5">
            <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {label}
            </div>
            <div className="font-mono text-sm font-semibold tabular-nums">
                {value}
            </div>
        </div>
    )
}

function TimelineRow({
    label,
    value,
    variant,
}: {
    label: string
    value: string
    variant: "start" | "end"
}) {
    return (
        <div className="flex items-center gap-3 rounded-md border border-border/40 bg-card/40 px-3 py-1.5">
            <span
                className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    variant === "start" ? "bg-emerald-500" : "bg-rose-500",
                )}
            />
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {label}
                </span>
                <span className="truncate font-mono text-[11px] tabular-nums">
                    {value}
                </span>
            </div>
        </div>
    )
}

// ─── Bottom stat strip ──────────────────────────────────────────────

function StatStrip({ data }: { data: RoutePolyline }) {
    const km = (data.distance_m / 1000).toFixed(2)
    return (
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex items-stretch gap-px overflow-hidden rounded-xl border border-border/60 bg-background/85 font-mono text-xs shadow-xl shadow-slate-900/10 backdrop-blur-xl">
            <Pill label="Masofa" value={`${km} km`} accent="emerald" />
            <Pill label="Nuqtalar" value={data.count.toLocaleString()} />
            <Pill
                label="Davomiyligi"
                value={formatDuration(data.first_at, data.last_at)}
            />
            {data.trip != null && (
                <Pill label="Reys" value={`#${data.trip}`} accent="primary" />
            )}
        </div>
    )
}

function Pill({
    label,
    value,
    accent,
}: {
    label: string
    value: string
    accent?: "emerald" | "primary"
}) {
    const accentColor =
        accent === "emerald"
            ? "text-emerald-600 dark:text-emerald-400"
            : accent === "primary"
            ? "text-primary"
            : "text-foreground"
    return (
        <div className="flex flex-col bg-background/40 px-3 py-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {label}
            </span>
            <span className={cn("text-sm font-semibold tabular-nums", accentColor)}>
                {value}
            </span>
        </div>
    )
}

// ─── Formatters ─────────────────────────────────────────────────────

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
