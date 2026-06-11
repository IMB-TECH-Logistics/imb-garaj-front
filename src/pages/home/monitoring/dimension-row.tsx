import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export function formatStaleness(seconds: number | null): string {
    if (seconds == null) return "—"
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60} min`
}

export const STALE_THRESHOLD_SECONDS = 5 * 60

type DimensionRowProps = {
    primary: ReactNode
    secondary?: ReactNode
    metaRight?: ReactNode
    secondsSince: number | null
    active?: boolean
    onClick?: () => void
    index?: number
    badge?: ReactNode
}

export function DimensionRow({
    primary,
    secondary,
    metaRight,
    secondsSince,
    active,
    onClick,
    index = 0,
    badge,
}: DimensionRowProps) {
    const stale =
        secondsSince == null || secondsSince > STALE_THRESHOLD_SECONDS

    return (
        <li
            style={{ animationDelay: `${index * 35}ms` }}
            className="opacity-0 animate-[slide-in_320ms_cubic-bezier(.2,.7,.2,1)_forwards]"
        >
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    "group relative flex w-full flex-col gap-0.5 overflow-hidden rounded-lg border bg-card py-2 pl-3.5 pr-3 text-left transition",
                    "hover:border-primary/40 hover:bg-accent/40",
                    active
                        ? "border-primary/60 ring-1 ring-primary/20"
                        : "border-border/70",
                )}
            >
                <span
                    aria-hidden
                    className={cn(
                        "absolute inset-y-0 left-0 w-[3px]",
                        stale ? "bg-slate-400/70" : "bg-emerald-500",
                    )}
                />

                <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-sm font-semibold tracking-tight">
                            {primary}
                        </span>
                        {badge}
                    </span>
                    <span
                        className={cn(
                            "shrink-0 font-mono text-[10px] uppercase tracking-wider tabular-nums",
                            stale
                                ? "text-muted-foreground"
                                : "text-emerald-600 dark:text-emerald-400",
                        )}
                    >
                        {formatStaleness(secondsSince)}
                    </span>
                </div>

                {(secondary || metaRight) && (
                    <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                        <span className="flex min-w-0 items-center gap-3">
                            {secondary}
                        </span>
                        {metaRight && (
                            <span className="shrink-0">{metaRight}</span>
                        )}
                    </div>
                )}
            </button>
        </li>
    )
}

export function DimensionListSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="flex flex-col gap-2">
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-[52px] w-full rounded-lg" />
            ))}
        </div>
    )
}

export function DimensionEmpty({
    title,
    hint,
}: {
    title: string
    hint?: string
}) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted/60">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {hint && (
                <p className="text-[11px] text-muted-foreground/70">{hint}</p>
            )}
        </div>
    )
}
