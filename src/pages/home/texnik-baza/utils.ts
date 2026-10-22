import type { Axle, TechStatus } from "./types"

export const STATUS_DOT: Record<TechStatus, string> = {
    ok: "bg-emerald-500",
    warn: "bg-amber-400",
    over: "bg-red-500",
    none: "bg-muted-foreground/40",
}

export const STATUS_WHEEL: Record<TechStatus, string> = {
    ok: "bg-emerald-500 border-emerald-700 text-white",
    warn: "bg-amber-400 border-amber-600 text-black",
    over: "bg-red-500 border-red-700 text-white",
    none: "bg-muted border-border text-muted-foreground",
}

export const STATUS_BAR: Record<TechStatus, string> = {
    ok: "bg-emerald-500",
    warn: "bg-amber-400",
    over: "bg-red-500",
    none: "bg-muted-foreground/40",
}

export const positionsOf = (axles: Axle[]): string[] =>
    axles.flatMap((axle, i) => {
        const n = i + 1
        const sides = ["L", "R"]
        return sides.flatMap((side) =>
            axle.dual ?
                [`${n}${side}O`, `${n}${side}I`]
            :   [`${n}${side}O`],
        )
    })

export const fmtKm = (value: number | null | undefined) =>
    value === null || value === undefined ?
        "—"
    :   Math.round(value).toLocaleString("ru-RU").replace(/\u00a0/g, " ")

export const statusOf = (pct: number | null | undefined): TechStatus =>
    pct === null || pct === undefined ? "none"
    : pct >= 100 ? "over"
    : pct >= 80 ? "warn"
    : "ok"
