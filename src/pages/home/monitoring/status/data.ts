import { startOfDay } from "date-fns"
import type { TFunction } from "i18next"

export const ORDER_STATUS = {
    PENDING: 0,
    STARTED: 1,
    LOADING: 5,
    IN_TRANSIT: 6,
    UNLOADING: 7,
    COMPLETED: 2,
    CANCELED: 3,
    ARCHIVED: 4,
} as const

export const IDLE = -100
export const EMPTY_RUN = -101
export const IDLE_STOP = -102
export const REPAIR = -103
export const IN_GARAGE = -104

export type VehicleRowKind = "reys" | "empty" | "idle" | "repair" | "garage"

export const ROW_KIND_STATUS: Record<Exclude<VehicleRowKind, "reys">, number> = {
    empty: EMPTY_RUN,
    idle: IDLE_STOP,
    repair: REPAIR,
    garage: IN_GARAGE,
}

export type ApiVehicleRow = {
    kind: VehicleRowKind
    order_id: number | null
    external_id: string | null
    from_place: string | null
    to_place: string | null
    start: string
    end: string
    km: number | null
    fuel: number | null
    stages: { status: number; start: string; end: string }[]
}

export type StatusKey = number

export const ACTIVE_STATUSES: number[] = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.STARTED,
    ORDER_STATUS.LOADING,
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.UNLOADING,
]

export const STATUS_META: Record<
    number,
    { labelKey: string; bar: string; dot: string; color: string }
> = {
    [ORDER_STATUS.PENDING]: {
        labelKey: "status.pending",
        bar: "bg-amber-400",
        dot: "bg-amber-400",
        color: "#fbbf24",
    },
    [ORDER_STATUS.STARTED]: {
        labelKey: "status.started",
        bar: "bg-sky-400",
        dot: "bg-sky-400",
        color: "#38bdf8",
    },
    [ORDER_STATUS.LOADING]: {
        labelKey: "status.loading_status",
        bar: "bg-violet-400",
        dot: "bg-violet-400",
        color: "#a78bfa",
    },
    [ORDER_STATUS.IN_TRANSIT]: {
        labelKey: "status.transit",
        bar: "bg-emerald-500",
        dot: "bg-emerald-500",
        color: "#10b981",
    },
    [ORDER_STATUS.UNLOADING]: {
        labelKey: "status.unloading_status",
        bar: "bg-orange-400",
        dot: "bg-orange-400",
        color: "#fb923c",
    },
    [EMPTY_RUN]: {
        labelKey: "trips.managers.empty_run",
        bar: "bg-slate-400",
        dot: "bg-slate-400",
        color: "#94a3b8",
    },
    [IDLE_STOP]: {
        labelKey: "status.idle_stop",
        bar: "bg-rose-400",
        dot: "bg-rose-400",
        color: "#fb7185",
    },
    [REPAIR]: {
        labelKey: "status.repair",
        bar: "bg-red-600",
        dot: "bg-red-600",
        color: "#dc2626",
    },
    [IN_GARAGE]: {
        labelKey: "status.in_garage",
        bar: "bg-yellow-600",
        dot: "bg-yellow-600",
        color: "#ca8a04",
    },
    [IDLE]: {
        labelKey: "mon.status.idle",
        bar: "bg-muted-foreground/15",
        dot: "bg-muted-foreground/30",
        color: "#9ca3af",
    },
}

export type VehicleRow = {
    id: number
    truck_number: string
    driver_name: string
    type: string
    current_status: number
}

export type Segment = {
    status: number
    start: Date
    end: Date
}

export type DaySegment = {
    status: number
    startMin: number
    endMin: number
    start: Date
    end: Date
}

export type ApiStatusVehicle = {
    id: number
    truck_number: string
    driver_name: string | null
    type: string | null
    current_status: number
    totals: Record<number, number>
    gps: GpsSummary | null
}

export type GpsSummary = {
    distance_km: number
    moving_minutes: number
    stop_minutes: number
}

export type ApiStatusSegment = {
    status: number
    start: string
    end: string
}

export type ApiStatusRoute = {
    vehicle: number | null
    status: number
    count: number
    distance_m: number
    duration_min: number
    first_at: string | null
    last_at: string | null
    bbox: [number, number, number, number] | null
    points: [number, number][]
}

const HOUR = 3600 * 1000

export function splitByDay(segments: Segment[], day: Date): DaySegment[] {
    const dayStart = startOfDay(day).getTime()
    const dayEnd = dayStart + 24 * HOUR
    const out: DaySegment[] = []
    for (const seg of segments) {
        const s = Math.max(seg.start.getTime(), dayStart)
        const e = Math.min(seg.end.getTime(), dayEnd)
        if (e <= s) continue
        out.push({
            status: seg.status,
            startMin: Math.round((s - dayStart) / 60000),
            endMin: Math.round((e - dayStart) / 60000),
            start: seg.start,
            end: seg.end,
        })
    }
    return out
}

export function formatDurationShort(mins: number, t: TFunction): string {
    const total = Math.round(mins)
    const h = Math.floor(total / 60)
    const m = total % 60
    if (h === 0) return t("mon.duration.m_short", { m })
    return m
        ? t("mon.duration.hm_short", { h, m })
        : t("mon.duration.h_short", { h })
}

export function minsToHHMM(mins: number): string {
    const m = Math.max(0, Math.min(1440, Math.round(mins)))
    const h = Math.floor(m / 60)
    const mm = m % 60
    return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

export type ColoredPathSegment = {
    points: [number, number][]
    color: string
    status: number
}
