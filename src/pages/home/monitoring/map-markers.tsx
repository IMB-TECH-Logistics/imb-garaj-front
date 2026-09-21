import { cn } from "@/lib/utils"
import { Truck } from "lucide-react"
import type { LiveMarker, MapPoi } from "./route-map"

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

export function DriverMarker({ marker }: { marker: LiveMarker }) {
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

export function PoiMarker({ poi }: { poi: MapPoi }) {
    if (poi.kind === "stop") {
        return (
            <div
                title={poi.title}
                className="grid h-6 w-6 place-items-center rounded-md border-2 border-white bg-amber-500 font-mono text-[11px] font-bold text-amber-950 shadow-md"
            >
                P
            </div>
        )
    }
    return (
        <div
            title={poi.title}
            className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-sky-500 shadow-lg shadow-slate-900/40"
        >
            <Truck className="h-5 w-5 text-white" />
        </div>
    )
}
