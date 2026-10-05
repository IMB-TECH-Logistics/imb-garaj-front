import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Truck } from "lucide-react"
import type { MarkerCluster } from "./marker-clusters"
import type { LiveMarker, MapPoi } from "./route-map"
import { RUSSIA_FLAG_GRADIENT } from "./types"

export function RussiaFlag({ className }: { className?: string }) {
    return (
        <span
            aria-label="Rossiya"
            title="Rossiya reysi"
            className={cn("inline-block h-3 w-[18px] shrink-0 rounded-[2px] ring-1 ring-slate-900/15", className)}
            style={{ background: RUSSIA_FLAG_GRADIENT }}
        />
    )
}

export function EndpointDot({
    variant,
    label,
}: {
    variant: "start" | "end"
    label: string
}) {
    const color =
        variant === "start"
            ? "bg-emerald-500"
            : "bg-rose-500"
    const ring =
        variant === "start"
            ? "ring-emerald-500/30"
            : "ring-rose-500/30"
    return (
        <div className="group relative flex items-center justify-center">
            <div className={cn("h-3 w-3 rounded-full ring-4", color, ring)} />
            <div
                className={cn(
                    "pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100",
                    variant === "start" ? "bg-emerald-600" : "bg-rose-600",
                )}
            >
                {label}
            </div>
        </div>
    )
}


const DOT_TONE_COLORS = {
    loaded: "#10b981",
    empty: "#0ea5e9",
    repair: "#f97316",
} as const

function TruckSilhouette({ color, online, size }: { color: string; online: boolean; size: number }) {
    const fill = online ? color : "#e2e8f0"
    return (
        <svg width={size} height={size * (40 / 24)} viewBox="0 0 24 40" aria-hidden>
            <rect x="4" y="12.5" width="16" height="26.5" rx="2" fill={fill} stroke="#020617" strokeWidth="1.6" />
            <line x1="8" y1="17" x2="8" y2="35" stroke="#020617" strokeOpacity="0.25" strokeWidth="1" />
            <line x1="16" y1="17" x2="16" y2="35" stroke="#020617" strokeOpacity="0.25" strokeWidth="1" />
            <rect x="10.5" y="10" width="3" height="3" fill="#020617" />
            <rect x="5" y="1" width="14" height="10" rx="3" fill={fill} stroke="#020617" strokeWidth="1.6" />
            <rect x="7" y="2.6" width="10" height="3.2" rx="1" fill="#020617" fillOpacity="0.85" />
        </svg>
    )
}

function CompactTruckMarker({ marker }: { marker: LiveMarker }) {
    const online = !marker.stale
    const color = DOT_TONE_COLORS[marker.tone ?? "empty"]
    const selected = !!marker.selected
    return (
        <button
            type="button"
            onClick={marker.onClick}
            aria-label={marker.label}
            className={cn("group relative flex flex-col items-center", selected && "z-10")}
        >
            <span
                className={cn(
                    "grid place-items-center transition-transform group-hover:scale-125",
                    selected
                        ? "h-9 w-9 drop-shadow-[0_0_6px_rgba(59,130,246,0.95)]"
                        : "h-7 w-7 drop-shadow-[0_1px_2px_rgba(15,23,42,0.5)]",
                )}
                style={{ transform: `rotate(${marker.course ?? 0}deg)` }}
            >
                <TruckSilhouette color={color} online={online} size={selected ? 18 : 13} />
            </span>
            <span
                className={cn(
                    "-mt-0.5 whitespace-nowrap rounded px-1 font-mono text-[10px] font-semibold leading-[14px] shadow-sm",
                    online ? "bg-slate-950 text-white" : "bg-slate-700 text-slate-200",
                    selected && "ring-2 ring-primary/70",
                )}
            >
                {marker.label}
            </span>
            {marker.sub && marker.sub !== marker.label && (
                <span
                    className={cn(
                        "pointer-events-none mt-px whitespace-nowrap rounded bg-slate-900/95 px-1 font-mono text-[10px] text-slate-200 shadow-md",
                        selected ? "block" : "absolute top-full z-10 hidden group-hover:block",
                    )}
                >
                    {marker.sub}
                </span>
            )}
        </button>
    )
}

export function DriverMarker({ marker }: { marker: LiveMarker }) {
    if (marker.icon === "truck" && marker.tone) return <CompactTruckMarker marker={marker} />
    const fresh = !marker.stale
    return (
        <button
            type="button"
            onClick={marker.onClick}
            className="group relative flex flex-col items-center transition will-change-transform hover:-translate-y-0.5 hover:scale-[1.04]"
        >
            {/* pulse */}
            {fresh && marker.icon !== "truck" && (
                <>
                    <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[140%] h-10 w-10 rounded-full bg-emerald-500/30 animate-ping" />
                    <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[140%] h-7 w-7 rounded-full bg-emerald-500/40 animate-pulse" />
                </>
            )}

            {/* pin head */}
            <div
                className={cn(
                    "relative z-10 flex h-9 w-9 -mt-1 items-center justify-center rounded-full border-2 shadow-lg shadow-slate-900/30 backdrop-blur",
                    fresh
                        ? "border-emerald-500 bg-white/95 dark:bg-slate-900/95"
                        : "border-slate-400/60 bg-slate-200/85 dark:border-slate-600 dark:bg-slate-800/85",
                    marker.selected && "ring-4 ring-primary/40",
                )}
            >
                {marker.icon === "truck" ? (
                    <Truck
                        className={cn(
                            "h-5 w-5",
                            fresh ? "text-emerald-500" : "text-slate-500",
                        )}
                    />
                ) : (
                    <span
                        className={cn(
                            "h-2 w-2 rounded-full",
                            fresh ? "bg-emerald-500" : "bg-slate-500",
                        )}
                    />
                )}
            </div>

            {/* pin tail */}
            <span
                className={cn(
                    "z-0 -mt-0.5 h-2 w-0.5",
                    fresh ? "bg-emerald-500" : "bg-slate-400",
                )}
            />

            {/* label */}
            <div
                className={cn(
                    "mt-0.5 max-w-[180px] truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold shadow-md backdrop-blur-md transition",
                    fresh
                        ? "bg-white/95 text-slate-900 dark:bg-slate-900/95 dark:text-white"
                        : "bg-slate-200/85 text-slate-700 dark:bg-slate-800/85 dark:text-slate-300",
                )}
            >
                {marker.label}
            </div>
            {marker.sub && marker.sub !== marker.label && (
                <div className="mt-px max-w-[180px] truncate rounded-sm bg-white/85 px-1.5 py-px font-mono text-[10px] font-medium text-slate-600 shadow-sm dark:bg-slate-900/85 dark:text-slate-400">
                    {marker.sub}
                </div>
            )}
        </button>
    )
}

const CLUSTER_TONE_COLORS = {
    loaded: "#10b981",
    empty: "#0ea5e9",
    repair: "#f97316",
} as const

function clusterRing(members: LiveMarker[]) {
    const counts = { loaded: 0, empty: 0, repair: 0 }
    members.forEach((m) => {
        counts[m.tone ?? "loaded"] += 1
    })
    let from = 0
    const stops = (Object.keys(counts) as (keyof typeof counts)[])
        .filter((k) => counts[k] > 0)
        .map((k) => {
            const to = from + (counts[k] / members.length) * 360
            const stop = `${CLUSTER_TONE_COLORS[k]} ${from}deg ${to}deg`
            from = to
            return stop
        })
    return `conic-gradient(${stops.join(", ")})`
}

function ClusterBubble({ cluster, onClick }: { cluster: MarkerCluster; onClick?: () => void }) {
    const count = cluster.members.length
    const size = count >= 50 ? 32 : count >= 10 ? 28 : 24
    const offline = cluster.members.every((m) => m.stale)
    return (
        <button
            type="button"
            onClick={onClick}
            title={`${count} ta mashina`}
            className={cn(
                "grid place-items-center rounded-full p-[3px] shadow-md shadow-slate-900/30 transition will-change-transform hover:scale-110",
                offline && "opacity-70",
            )}
            style={{ width: size, height: size, background: clusterRing(cluster.members) }}
        >
            <span className="grid h-full w-full place-items-center rounded-full bg-white text-[11px] font-bold tabular-nums text-slate-900 dark:bg-slate-900 dark:text-white">
                {count}
            </span>
        </button>
    )
}

export function ClusterMarker({
    cluster,
    spread,
    onZoom,
}: {
    cluster: MarkerCluster
    spread: boolean
    onZoom: () => void
}) {
    if (spread) return <ClusterBubble cluster={cluster} onClick={onZoom} />
    return (
        <Popover>
            <PopoverTrigger asChild>
                <div>
                    <ClusterBubble cluster={cluster} />
                </div>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-64 p-1">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Bir joyda {cluster.members.length} ta mashina
                </div>
                <div className="max-h-72 overflow-y-auto">
                    {cluster.members.map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            onClick={m.onClick}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                        >
                            <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ background: CLUSTER_TONE_COLORS[m.tone ?? "loaded"] }}
                            />
                            <span className="truncate font-medium">{m.label}</span>
                            {m.sub && m.sub !== m.label && (
                                <span className="ml-auto truncate font-mono text-xs text-muted-foreground">{m.sub}</span>
                            )}
                            {m.stale && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-slate-400" />}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function PoiMarker({ poi }: { poi: MapPoi }) {
    return (
        <button
            type="button"
            title={poi.title}
            onClick={poi.onClick}
            className={cn(
                "flex cursor-pointer flex-col items-center transition hover:scale-110",
                poi.dimmed && "opacity-30",
                poi.highlight && "z-10",
            )}
        >
            <span
                className={cn(
                    "grid place-items-center rounded-md border-2 border-white font-mono font-bold shadow-md",
                    poi.highlight
                        ? "h-7 w-7 bg-red-600 text-[13px] text-white ring-2 ring-red-600/40"
                        : "h-6 w-6 bg-amber-500 text-[11px] text-amber-950",
                )}
            >
                P
            </span>
            {poi.label && (
                <span
                    className={cn(
                        "mt-0.5 whitespace-nowrap rounded px-1 py-px font-mono leading-tight shadow-md",
                        poi.highlight
                            ? "bg-red-600 text-[12px] font-bold text-white"
                            : "bg-slate-950/90 text-[10px] font-semibold text-white",
                    )}
                >
                    {poi.label}
                </span>
            )}
        </button>
    )
}

const tooltipTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
})

export function SpeedTooltip({ speed, time }: { speed: number; time?: number }) {
    return (
        <div className="pointer-events-none flex items-baseline gap-1.5 whitespace-nowrap rounded-md bg-slate-900/95 px-2 py-1 text-white shadow-lg">
            <span className="font-mono text-sm font-bold tabular-nums">{Math.round(speed)}</span>
            <span className="text-[11px] text-slate-300">km/h</span>
            {time != null && (
                <span className="font-mono text-[11px] tabular-nums text-slate-400">
                    {tooltipTime.format(time)}
                </span>
            )}
        </div>
    )
}
