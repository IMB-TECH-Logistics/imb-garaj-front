import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import { ArrowUpRight, Truck } from "lucide-react"
import type { LiveDriver } from "./types"

function formatStaleness(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
}

type Props = {
    items: LiveDriver[]
    loading?: boolean
    activeUserId?: number | null
    onSelect?: (driver: LiveDriver) => void
}

export default function LiveDriverList({
    items,
    loading,
    activeUserId,
    onSelect,
}: Props) {
    const navigate = useNavigate()

    if (loading && items.length === 0) {
        return (
            <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
                ))}
            </div>
        )
    }

    if (!loading && items.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-muted/60">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">
                    Hozir efirda haydovchi yo'q
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                    Yangi signal kelganda bu yerda paydo bo'ladi
                </p>
            </div>
        )
    }

    return (
        <ul className="flex flex-col gap-1.5">
            {items.map((driver, i) => {
                const stale = driver.seconds_since > 5 * 60
                const isActive = driver.user === activeUserId
                return (
                    <li
                        key={driver.user}
                        style={{ animationDelay: `${i * 35}ms` }}
                        className="opacity-0 animate-[slide-in_320ms_cubic-bezier(.2,.7,.2,1)_forwards]"
                    >
                        <button
                            type="button"
                            onClick={() => onSelect?.(driver)}
                            className={cn(
                                "group relative flex w-full items-stretch gap-3 overflow-hidden rounded-lg border bg-card/90 p-3 text-left backdrop-blur-sm transition",
                                "hover:border-primary/40 hover:bg-card",
                                isActive
                                    ? "border-primary/60 ring-2 ring-primary/15"
                                    : "border-border/70",
                            )}
                        >
                            {/* left accent bar */}
                            <span
                                aria-hidden
                                className={cn(
                                    "absolute top-0 bottom-0 left-0 w-[3px]",
                                    stale ? "bg-slate-400" : "bg-emerald-500",
                                )}
                            />

                            <div className="flex shrink-0 items-center pl-1">
                                <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center">
                                    {!stale && (
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70" />
                                    )}
                                    <span
                                        className={cn(
                                            "relative inline-flex h-2 w-2 rounded-full",
                                            stale
                                                ? "bg-slate-400"
                                                : "bg-emerald-500",
                                        )}
                                    />
                                </span>
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-sm font-semibold tracking-tight">
                                        {driver.driver_name ||
                                            `Driver #${driver.user}`}
                                    </span>
                                    <span
                                        className={cn(
                                            "shrink-0 font-mono text-[10px] uppercase tracking-wider tabular-nums",
                                            stale
                                                ? "text-muted-foreground"
                                                : "text-emerald-600 dark:text-emerald-400",
                                        )}
                                    >
                                        {formatStaleness(driver.seconds_since)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                    {driver.vehicle_number && (
                                        <span className="inline-flex items-center gap-1">
                                            <Truck className="h-3 w-3" />
                                            <span className="font-mono tracking-wide">
                                                {driver.vehicle_number}
                                            </span>
                                        </span>
                                    )}
                                    {driver.trip != null && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                navigate({
                                                    to: "/monitoring/trips/$id",
                                                    params: {
                                                        id: String(driver.trip),
                                                    },
                                                })
                                            }}
                                            className="inline-flex items-center gap-0.5 rounded-sm text-primary transition hover:underline"
                                        >
                                            <span className="font-mono">
                                                R-{driver.trip}
                                            </span>
                                            <ArrowUpRight className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </button>
                    </li>
                )
            })}
        </ul>
    )
}
