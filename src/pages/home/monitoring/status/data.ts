import { startOfDay } from "date-fns"

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
    { label: string; bar: string; dot: string; color: string }
> = {
    [ORDER_STATUS.PENDING]: {
        label: "Kutilmoqda",
        bar: "bg-amber-400",
        dot: "bg-amber-400",
        color: "#fbbf24",
    },
    [ORDER_STATUS.STARTED]: {
        label: "Boshlandi",
        bar: "bg-sky-400",
        dot: "bg-sky-400",
        color: "#38bdf8",
    },
    [ORDER_STATUS.LOADING]: {
        label: "Yuklanmoqda",
        bar: "bg-violet-400",
        dot: "bg-violet-400",
        color: "#a78bfa",
    },
    [ORDER_STATUS.IN_TRANSIT]: {
        label: "Yo'lda",
        bar: "bg-emerald-500",
        dot: "bg-emerald-500",
        color: "#10b981",
    },
    [ORDER_STATUS.UNLOADING]: {
        label: "Tushirilmoqda",
        bar: "bg-orange-400",
        dot: "bg-orange-400",
        color: "#fb923c",
    },
    [IDLE]: {
        label: "Bo'sh",
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
