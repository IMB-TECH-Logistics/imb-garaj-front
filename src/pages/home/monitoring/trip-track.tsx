import { Button } from "@/components/ui/button"
import {
    MANAGERS_TRIPS,
    MONITORING_TRIP_TRACK,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { useNavigate, useParams } from "@tanstack/react-router"
import { ArrowLeft, Gauge, Route, Truck, User2 } from "lucide-react"
import RouteMap from "./route-map"
import type { RoutePolyline } from "./types"

type TripDetail = {
    id: number
    driver_name?: string | null
    start?: string | null
    end?: string | null
    start_mileage?: number
    end_mileage?: number
    vehicle?: number
}

export default function TripTrackPage() {
    const params = useParams({ strict: false }) as { id: string }
    const navigate = useNavigate()
    const tripId = Number(params.id)

    const polyline = useGet<RoutePolyline>(
        `${MONITORING_TRIP_TRACK}/${tripId}/track`,
        { params: { max_points: 2000 }, enabled: !Number.isNaN(tripId) },
    )

    const trip = useGet<TripDetail>(`${MANAGERS_TRIPS}/${tripId}`, {
        enabled: !Number.isNaN(tripId),
    })

    const km = polyline.data
        ? (polyline.data.distance_m / 1000).toFixed(2)
        : "—"
    const totalMileage =
        trip.data?.start_mileage != null && trip.data?.end_mileage != null
            ? trip.data.end_mileage - trip.data.start_mileage
            : null

    return (
        <div className="-m-4 -mt-20 flex h-screen flex-col bg-slate-50 pt-20 dark:bg-slate-950">
            <header className="relative z-20 flex items-center gap-3 border-b border-border/60 bg-background/85 px-5 py-3 backdrop-blur-xl">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate({ to: "/monitoring" })}
                    className="h-9 w-9"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Route className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-base font-semibold leading-tight tracking-tight">
                            Reys marshruti
                        </h1>
                        <span className="font-mono text-xs text-muted-foreground">
                            #{tripId}
                        </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        {trip.data?.driver_name ?? "—"}
                        {trip.data?.start
                            ? ` · ${formatDate(trip.data.start)}`
                            : ""}
                        {trip.data?.end
                            ? ` → ${formatDate(trip.data.end)}`
                            : trip.data?.start
                            ? " → davom etmoqda"
                            : ""}
                    </p>
                </div>
            </header>

            <div className="relative flex-1 overflow-hidden">
                <RouteMap
                    height="100%"
                    className="absolute inset-0"
                    points={polyline.data?.points}
                    bbox={polyline.data?.bbox ?? null}
                    gradient
                />

                {/* Right glass panel */}
                <aside className="pointer-events-none absolute top-4 right-4 bottom-4 z-10 flex w-[340px] flex-col">
                    <div className="pointer-events-auto flex h-full min-h-0 flex-col gap-3 overflow-y-auto rounded-xl border border-border/60 bg-background/85 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
                        {/* Big distance hero */}
                        <div className="relative overflow-hidden rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] p-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
                                Bosib o'tilgan masofa
                            </div>
                            <div className="mt-1 flex items-baseline gap-1.5">
                                <span className="font-mono text-4xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                                    {km}
                                </span>
                                <span className="text-sm font-medium text-emerald-700/70 dark:text-emerald-400/70">
                                    km
                                </span>
                            </div>
                            {/* deco line */}
                            <div
                                aria-hidden
                                className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full bg-emerald-500/10"
                            />
                            <div
                                aria-hidden
                                className="pointer-events-none absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-emerald-500/10"
                            />
                        </div>

                        {/* Identity rows */}
                        <SectionGroup>
                            <Row
                                icon={<User2 className="h-3.5 w-3.5" />}
                                label="Haydovchi"
                                value={trip.data?.driver_name ?? "—"}
                            />
                            <Row
                                icon={<Truck className="h-3.5 w-3.5" />}
                                label="Mashina"
                                value={
                                    trip.data?.vehicle != null
                                        ? `#${trip.data.vehicle}`
                                        : "—"
                                }
                                mono
                            />
                        </SectionGroup>

                        {/* Timeline */}
                        <SectionLabel>Vaqt jadvali</SectionLabel>
                        <div className="flex flex-col gap-1.5">
                            <TimelineDot
                                label="Start"
                                value={formatStamp(polyline.data?.first_at)}
                                variant="start"
                            />
                            <div className="ml-[7px] h-3 w-px bg-gradient-to-b from-emerald-500 to-rose-500" />
                            <TimelineDot
                                label="Finish"
                                value={formatStamp(polyline.data?.last_at)}
                                variant="end"
                            />
                        </div>

                        {/* Numeric grid */}
                        <SectionLabel>Ko'rsatkichlar</SectionLabel>
                        <div className="grid grid-cols-2 gap-1.5">
                            <Tile
                                label="Nuqtalar"
                                value={(
                                    polyline.data?.count ?? 0
                                ).toLocaleString()}
                            />
                            <Tile
                                label="Davomiyligi"
                                value={formatDuration(
                                    polyline.data?.first_at ?? null,
                                    polyline.data?.last_at ?? null,
                                )}
                            />
                            {totalMileage != null && (
                                <Tile
                                    label="Probeg"
                                    value={`${totalMileage}`}
                                    icon={<Gauge className="h-3 w-3" />}
                                />
                            )}
                            {trip.data?.start_mileage != null && (
                                <Tile
                                    label="Boshl. probeg"
                                    value={`${trip.data.start_mileage}`}
                                />
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}

// ─── Local primitives ───────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {children}
        </div>
    )
}

function SectionGroup({ children }: { children: React.ReactNode }) {
    return (
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card/50">
            {children}
        </div>
    )
}

function Row({
    icon,
    label,
    value,
    mono,
}: {
    icon: React.ReactNode
    label: string
    value: string
    mono?: boolean
}) {
    return (
        <div className="flex items-center gap-3 border-b border-border/40 px-3 py-2 last:border-b-0">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-muted text-muted-foreground">
                {icon}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {label}
                </span>
                <span
                    className={cn(
                        "truncate text-sm font-medium",
                        mono && "font-mono tabular-nums",
                    )}
                >
                    {value}
                </span>
            </div>
        </div>
    )
}

function TimelineDot({
    label,
    value,
    variant,
}: {
    label: string
    value: string
    variant: "start" | "end"
}) {
    return (
        <div className="flex items-center gap-3">
            <span
                className={cn(
                    "h-3.5 w-3.5 shrink-0 rounded-full ring-4",
                    variant === "start"
                        ? "bg-emerald-500 ring-emerald-500/20"
                        : "bg-rose-500 ring-rose-500/20",
                )}
            />
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {label}
                </span>
                <span className="font-mono text-xs tabular-nums">{value}</span>
            </div>
        </div>
    )
}

function Tile({
    label,
    value,
    icon,
}: {
    label: string
    value: string
    icon?: React.ReactNode
}) {
    return (
        <div className="rounded-md border border-border/40 bg-muted/30 px-2.5 py-1.5">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                {icon}
                {label}
            </div>
            <div className="font-mono text-sm font-semibold tabular-nums">
                {value}
            </div>
        </div>
    )
}

// ─── Formatters ─────────────────────────────────────────────────────

function formatDate(raw: string | null | undefined): string {
    if (!raw) return "—"
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return raw
    return d.toLocaleDateString("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

function formatStamp(raw: string | null | undefined): string {
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
