import { addDays, startOfDay } from "date-fns"

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

export const MOCK_VEHICLES: VehicleRow[] = [
    { id: 1, truck_number: "01 A 123 AB", driver_name: "Xojakbar Komilov", type: "Tent", current_status: ORDER_STATUS.IN_TRANSIT },
    { id: 2, truck_number: "01 B 456 CD", driver_name: "Sardor Aliyev", type: "Ref", current_status: ORDER_STATUS.LOADING },
    { id: 3, truck_number: "01 C 789 EF", driver_name: "Jasur Karimov", type: "Tent", current_status: ORDER_STATUS.PENDING },
    { id: 4, truck_number: "01 D 012 GH", driver_name: "Bekzod Yusupov", type: "Bortovoy", current_status: ORDER_STATUS.UNLOADING },
    { id: 5, truck_number: "01 E 345 IJ", driver_name: "Otabek Rashidov", type: "Ref", current_status: IDLE },
    { id: 6, truck_number: "01 F 678 KL", driver_name: "Davron Toshev", type: "Tent", current_status: ORDER_STATUS.IN_TRANSIT },
    { id: 7, truck_number: "01 G 901 MN", driver_name: "Sherzod Umarov", type: "Tent", current_status: ORDER_STATUS.STARTED },
    { id: 8, truck_number: "01 H 234 OP", driver_name: "Akmal Nazarov", type: "Bortovoy", current_status: IDLE },
]

function mulberry32(seed: number) {
    let a = seed >>> 0
    return () => {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const HOUR = 3600 * 1000

export function buildMockTimeline(
    vehicleId: number,
    from: Date,
    to: Date,
): Segment[] {
    const rand = mulberry32(vehicleId * 7919 + 13)
    const segments: Segment[] = []
    const rangeStart = startOfDay(from).getTime()
    const rangeEnd = addDays(startOfDay(to), 1).getTime()

    let cursor = rangeStart + rand() * 8 * HOUR

    const pick = (min: number, max: number) =>
        (min + rand() * (max - min)) * HOUR

    while (cursor < rangeEnd) {
        const phases: Array<[number, number]> = [
            [ORDER_STATUS.PENDING, pick(1, 4)],
            [ORDER_STATUS.STARTED, pick(0.3, 1)],
            [ORDER_STATUS.LOADING, pick(1, 3)],
            [ORDER_STATUS.IN_TRANSIT, pick(4, 22)],
            [ORDER_STATUS.UNLOADING, pick(1, 3)],
        ]
        for (const [status, dur] of phases) {
            const start = cursor
            const end = cursor + dur
            if (start >= rangeEnd) break
            segments.push({
                status,
                start: new Date(start),
                end: new Date(Math.min(end, rangeEnd)),
            })
            cursor = end
            if (cursor >= rangeEnd) break
        }
        cursor += pick(3, 28)
    }
    return segments
}

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

export function buildMockTrack(
    vehicleId: number,
    status: number,
): [number, number][] {
    const rand = mulberry32(vehicleId * 104729 + (status + 200) * 1299709 + 7)
    const points: [number, number][] = []
    let lng = 69.18 + rand() * 0.22
    let lat = 41.24 + rand() * 0.16
    const n = 50 + Math.floor(rand() * 70)
    let hLng = (rand() - 0.5) * 0.01
    let hLat = (rand() - 0.5) * 0.01
    for (let i = 0; i < n; i++) {
        hLng += (rand() - 0.5) * 0.004
        hLat += (rand() - 0.5) * 0.004
        hLng = Math.max(-0.02, Math.min(0.02, hLng))
        hLat = Math.max(-0.02, Math.min(0.02, hLat))
        lng += hLng
        lat += hLat
        points.push([lng, lat])
    }
    return points
}

export function trackDistanceKm(points: [number, number][]): number {
    let m = 0
    for (let i = 1; i < points.length; i++) {
        const [lng1, lat1] = points[i - 1]
        const [lng2, lat2] = points[i]
        const R = 6371000
        const dLat = ((lat2 - lat1) * Math.PI) / 180
        const dLng = ((lng2 - lng1) * Math.PI) / 180
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLng / 2) ** 2
        m += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }
    return m / 1000
}
