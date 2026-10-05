import { DatePickerWithRange } from "@/components/form/date-range-picker"
import Select from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    MONITORING_GPS_HISTORY,
    MONITORING_GPS_HISTORY_DAYS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import { type ReactNode, useEffect, useMemo, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import type { ColoredSegment, MapPoi, MapPoint } from "./route-map"
import { type ReplayStatus, useRouteReplay } from "./route-replay"
import { ACTIVE_STATUSES, IDLE, STATUS_META } from "./status/data"
import type { GpsDay, GpsLiveVehicle, GpsPosition } from "./types"

const TZ = "Asia/Tashkent"
const TZ_OFFSET_MS = 5 * 3600 * 1000
const GAP_MS = 15 * 60 * 1000
const STOP_MIN_MS = 5 * 60 * 1000
const STOP_MERGE_M = 100
const DAY_COLORS = ["#5eb3f6", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#fb7185", "#22d3ee"]
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"]
const WEEKDAYS = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"]

type Point = { t: number; lat: number; lng: number; speed: number; day: string }
type Stop = { from: number; to: number; lat: number; lng: number }
type DayRange = { from: string; to: string }

const timeFormat = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })

const dayKey = (ms: number) => new Date(ms + TZ_OFFSET_MS).toISOString().slice(0, 10)

function toPoint(p: GpsPosition): Point {
    const t = Date.parse(p.fix_time)
    return { t, lat: p.latitude, lng: p.longitude, speed: p.speed ?? 0, day: dayKey(t) }
}

const clock = (ms: number) => timeFormat.format(ms)

const localKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

const keyToDate = (key: string) => {
    const [y, m, d] = key.split("-").map(Number)
    return new Date(y, m - 1, d)
}

function dayParts(key: string) {
    const d = new Date(`${key}T00:00:00Z`)
    return { name: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`, weekday: WEEKDAYS[d.getUTCDay()] }
}

function spanLabel(ms: number) {
    const minutes = Math.round(ms / 60000)
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    if (days) return `${days}d ${hours}h`
    return hours ? `${hours}h ${minutes % 60}m` : `${minutes % 60}m`
}

function shortDuration(ms: number) {
    const minutes = Math.round(ms / 60000)
    const hours = Math.floor(minutes / 60)
    return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`
}

function duration(ms: number) {
    const minutes = Math.round(ms / 60000)
    const hours = Math.floor(minutes / 60)
    return hours ? `${hours} soat ${minutes % 60} daq` : `${minutes} daq`
}

function metres(a: Point, b: Point) {
    const r = Math.PI / 180
    const h =
        Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
        Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2
    return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

const SPEED_STOPS: [number, [number, number, number]][] = [
    [55, [16, 185, 129]],
    [70, [250, 204, 21]],
    [85, [239, 68, 68]],
]

function speedColor(speed: number) {
    const [first] = SPEED_STOPS
    if (speed <= first[0]) return `rgb(${first[1].join(",")})`
    for (let i = 1; i < SPEED_STOPS.length; i++) {
        const [toSpeed, to] = SPEED_STOPS[i]
        if (speed <= toSpeed) {
            const [fromSpeed, from] = SPEED_STOPS[i - 1]
            const k = (speed - fromSpeed) / (toSpeed - fromSpeed)
            return `rgb(${from.map((c, j) => Math.round(c + (to[j] - c) * k)).join(",")})`
        }
    }
    return `rgb(${SPEED_STOPS[SPEED_STOPS.length - 1][1].join(",")})`
}

const SPEED_LEGEND = `linear-gradient(to right, ${SPEED_STOPS.map(([s, c], i) => `rgb(${c.join(",")}) ${(i / (SPEED_STOPS.length - 1)) * 100}%`).join(", ")})`

function summarize(points: Point[]) {
    let distance = 0
    let moving = 0
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]
        const b = points[i]
        const dt = b.t - a.t
        if (dt > GAP_MS) continue
        const d = metres(a, b)
        if (dt > 0 && (d / dt) * 3600 < 180) distance += d
        if (a.speed > 3 || b.speed > 3) moving += dt
    }

    const stops: Stop[] = []
    let run: { first: Point; last: Point } | null = null
    const close = () => {
        if (run && run.last.t - run.first.t >= STOP_MIN_MS) {
            stops.push({ from: run.first.t, to: run.last.t, lat: run.first.lat, lng: run.first.lng })
        }
        run = null
    }
    for (const p of points) {
        if (p.speed <= 2) run = run ? { ...run, last: p } : { first: p, last: p }
        else close()
    }
    close()

    return {
        distance,
        moving,
        stops,
        maxSpeed: points.reduce((max, p) => Math.max(max, p.speed), 0),
    }
}

export type ColorBy = "day" | "trip" | "status" | "speed"

export const COLOR_BY_OPTIONS: { value: ColorBy; label: string }[] = [
    { value: "day", label: "Kun" },
    { value: "trip", label: "Reys" },
    { value: "speed", label: "Tezlik" },
]

const TRIP_COLORS = ["#38bdf8", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#fb7185", "#22d3ee", "#c084fc"]

type TripSpan = { key: string; start: number; end: number; color: string; index: number; from?: string | null; to?: string | null }

const STAGE_ORDER: Record<number, number> = { 0: 0, 1: 1, 5: 2, 6: 3, 7: 4 }

function groupTrips(statuses: ReplayStatus[]): TripSpan[] {
    const sorted = [...statuses].sort((a, b) => a.start - b.start)
    const trips: TripSpan[] = []
    let previous: ReplayStatus | null = null
    for (const seg of sorted) {
        const last = trips[trips.length - 1]
        const sameOrder = seg.order != null && previous?.order != null && seg.order === previous.order
        const continues =
            last &&
            previous &&
            (sameOrder ||
                (seg.order == null &&
                    seg.start - previous.end <= 60 * 1000 &&
                    (STAGE_ORDER[seg.status] ?? 0) >= (STAGE_ORDER[previous.status] ?? 0)))
        if (continues) {
            last.end = Math.max(last.end, seg.end)
        } else {
            const index = trips.length
            trips.push({
                key: seg.order != null ? `o${seg.order}` : `r${index}`,
                start: seg.start,
                end: seg.end,
                color: TRIP_COLORS[index % TRIP_COLORS.length],
                index,
                from: seg.from ?? null,
                to: seg.to ?? null,
            })
        }
        previous = seg
    }
    return trips
}

export type Focus = { kind: "day" | "trip" | "status"; key: string }

export function useTrackerHistory(imei: string | null) {
    const days = useGet<GpsDay[]>(MONITORING_GPS_HISTORY_DAYS, {
        params: { imei },
        enabled: !!imei,
    })
    const [range, setRange] = useState<DayRange | null>(null)
    const [initialisedFor, setInitialisedFor] = useState<string | null>(null)
    const [colorBy, setColorBy] = useState<ColorBy>("day")
    const [focus, setFocus] = useState<Focus | null>(null)
    const focusDay = focus?.kind === "day" ? focus.key : null
    const [statusSegments, setStatusSegments] = useState<ReplayStatus[]>([])
    const bySpeed = colorBy === "speed"
    const [showStops, setShowStops] = useState(true)

    useEffect(() => {
        if (imei && days.data?.length && initialisedFor !== imei) {
            const today = dayKey(Date.now())
            const initial = days.data.some((d) => d.date === today) ? today : days.data[0].date
            setRange({ from: initial, to: initial })
            setInitialisedFor(imei)
        }
        if (!imei) {
            setRange(null)
            setInitialisedFor(null)
        }
    }, [imei, days.data, initialisedFor])

    const positions = useGet<GpsPosition[]>(MONITORING_GPS_HISTORY, {
        params: {
            imei,
            from: range ? `${range.from}T00:00:00+05:00` : undefined,
            to: range ? `${range.to}T23:59:59+05:00` : undefined,
        },
        enabled: !!imei && !!range,
    })

    const colors = useMemo<Record<string, string>>(
        () => Object.fromEntries((days.data ?? []).map((d, i) => [d.date, DAY_COLORS[i % DAY_COLORS.length]])),
        [days.data],
    )

    const points = useMemo<Point[]>(
        () =>
            (positions.data ?? [])
                .map(toPoint)
                .filter((p) => !!range && p.day >= range.from && p.day <= range.to),
        [positions.data, range],
    )

    const summary = useMemo(() => summarize(points), [points])
    const trips = useMemo(() => groupTrips(statusSegments), [statusSegments])

    useEffect(() => {
        setFocus(null)
    }, [imei, range?.from, range?.to])

    useEffect(() => {
        setFocus((f) => (f?.kind === "status" ? f : null))
    }, [colorBy])

    const inFocus = useCallback(
        (t: number) => {
            if (!focus) return true
            if (focus.kind === "day") return dayKey(t) === focus.key
            if (focus.kind === "trip") {
                const trip = trips.find((x) => t >= x.start && t < x.end)
                return focus.key === "idle" ? !trip : trip?.key === focus.key
            }
            const seg = statusSegments.find((x) => t >= x.start && t < x.end && STATUS_META[x.status])
            return focus.key === "idle" ? !seg : String(seg?.status) === focus.key
        },
        [focus, trips, statusSegments],
    )

    const replayPoints = useMemo(() => (focus ? points.filter((p) => inFocus(p.t)) : points), [points, focus, inFocus])
    const replay = useRouteReplay(replayPoints)

    const dim = (t: number) => (inFocus(t) ? 1 : 0.22)

    const tripStats = useMemo(
        () =>
            trips.map((trip) => ({
                ...trip,
                km: summarize(points.filter((p) => p.t >= trip.start && p.t < trip.end)).distance / 1000,
            })),
        [trips, points],
    )
    const idleKm = useMemo(
        () => summarize(points.filter((p) => !trips.some((x) => p.t >= x.start && p.t < x.end))).distance / 1000,
        [trips, points],
    )
    const idleMs = useMemo(() => {
        if (points.length < 2) return 0
        const from = points[0].t
        const to = points[points.length - 1].t
        const inTrips = trips.reduce((sum, x) => sum + Math.max(0, Math.min(x.end, to) - Math.max(x.start, from)), 0)
        return Math.max(0, to - from - inTrips)
    }, [trips, points])

    const segments = useMemo<ColoredSegment[]>(() => {
        const idleColor = STATUS_META[IDLE].color
        const covering = <T extends { start: number; end: number }>(list: T[], t: number) =>
            list.find((x) => t >= x.start && t < x.end)
        const keyOf = (p: Point) => {
            if (colorBy === "status") {
                const seg = covering(statusSegments, p.t)
                return seg && STATUS_META[seg.status] ? `s${seg.status}` : "idle"
            }
            if (colorBy === "trip") {
                const trip = covering(trips, p.t)
                return trip ? trip.key : "idle"
            }
            return p.day
        }
        const colorOf = (key: string, p: Point) => {
            if (key === "idle") return idleColor
            if (colorBy === "status") return STATUS_META[Number(key.slice(1))].color
            if (colorBy === "trip") return trips.find((x) => x.key === key)?.color ?? idleColor
            return colors[p.day]
        }
        const out: ColoredSegment[] = []
        let current: Point[] = []
        let currentKey = ""
        const flush = () => {
            if (current.length > 1) {
                if (bySpeed) {
                    for (let i = 1; i < current.length; i++) {
                        const a = current[i - 1]
                        const b = current[i]
                        out.push({
                            points: [[a.lng, a.lat], [b.lng, b.lat]],
                            color: speedColor(Math.max(a.speed, b.speed)),
                            opacity: dim(b.t),
                            speeds: [a.speed, b.speed],
                            times: [a.t, b.t],
                        })
                    }
                } else {
                    out.push({
                        points: current.map((p) => [p.lng, p.lat] as MapPoint),
                        color: colorOf(currentKey.split("|")[0], current[current.length - 1]),
                        opacity: dim(current[current.length - 1].t),
                        speeds: current.map((p) => p.speed),
                        times: current.map((p) => p.t),
                    })
                }
            }
            current = []
        }
        points.forEach((p, i) => {
            const previous = points[i - 1]
            const key = `${bySpeed ? "speed" : keyOf(p)}|${inFocus(p.t) ? 1 : 0}`
            if (previous && (p.t - previous.t > GAP_MS || (colorBy === "day" && p.day !== previous.day))) {
                flush()
            } else if (previous && key !== currentKey && current.length > 0) {
                const last = current[current.length - 1]
                flush()
                current.push(last)
            }
            currentKey = key
            current.push(p)
        })
        flush()
        return out
    }, [points, bySpeed, colors, colorBy, statusSegments, trips, inFocus])

    const bbox = useMemo<[number, number, number, number] | null>(() => {
        const scope = focus ? points.filter((p) => inFocus(p.t)) : points
        if (scope.length === 0) return null
        const lngs = scope.map((p) => p.lng)
        const lats = scope.map((p) => p.lat)
        return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]
    }, [points, focus, inFocus])

    const stopGroups = useMemo(() => {
        const groups: { lat: number; lng: number; stops: Stop[] }[] = []
        for (const stop of summary.stops) {
            const here = { lat: stop.lat, lng: stop.lng } as Point
            const group = groups.find((g) => metres({ lat: g.lat, lng: g.lng } as Point, here) <= STOP_MERGE_M)
            if (group) group.stops.push(stop)
            else groups.push({ lat: stop.lat, lng: stop.lng, stops: [stop] })
        }
        return groups
    }, [summary.stops])

    const groupView = stopGroups.map((g) => {
        const focused = g.stops.filter((x) => inFocus(x.from))
        const counted = focused.length ? focused : g.stops
        return {
            ...g,
            focused,
            total: counted.reduce((sum, x) => sum + (x.to - x.from), 0),
            count: counted.length,
        }
    })
    const longest = new Set(
        groupView
            .filter((g) => g.focused.length > 0 && g.total >= 30 * 60 * 1000)
            .sort((x, y) => y.total - x.total)
            .slice(0, 3),
    )
    const pois: MapPoi[] = showStops
        ? groupView.map((g, i) => ({
              id: `stop-${i}`,
              lat: g.lat,
              lng: g.lng,
              kind: "stop" as const,
              dimmed: g.focused.length === 0,
              label: shortDuration(g.total),
              highlight: longest.has(g),
              onClick: () => replay.seek((g.focused[0] ?? g.stops[0]).from),
              title: g.stops
                  .map((x) => `${dayParts(dayKey(x.from)).name} ${clock(x.from)}–${clock(x.to)}, ${duration(x.to - x.from)}`)
                  .join("\n"),
          }))
        : []

    const first = points[0]
    const last = points[points.length - 1]

    return {
        days: days.data ?? [],
        daysLoading: days.isLoading,
        loading: positions.isFetching,
        range,
        setRange,
        replay,
        colors,
        points,
        summary,
        bySpeed,
        colorBy,
        setColorBy,
        focus,
        setFocus,
        focusDay,
        inFocus,
        tripStats,
        idleKm,
        idleMs,
        setStatusSegments,
        trips,
        showStops,
        setShowStops,
        map: {
            segments,
            bbox,
            points: first && last && points.length > 1 ? ([[first.lng, first.lat], [last.lng, last.lat]] as MapPoint[]) : undefined,
            pois,
        },
    }
}

export type TrackerHistory = ReturnType<typeof useTrackerHistory>

type PanelProps = {
    history: TrackerHistory
    children?: ReactNode
}

export function ColorBySelect({ history, part }: { history: TrackerHistory; part: "header" | "legend" }) {
    if (part === "header") {
        return (
            <div className="text-sm">
                <div className="w-full">
                    <Select
                        value={history.colorBy}
                        setValue={(value) => history.setColorBy(value as ColorBy)}
                        options={COLOR_BY_OPTIONS}
                        label="Chiziq rangi"
                        className="h-10 text-xs"
                    />
                </div>
            </div>
        )
    }
    return (
        <div className="flex flex-col gap-1.5 text-sm">
            {history.colorBy === "trip" && (
                <div className="flex flex-col gap-1.5">
                    {history.tripStats.length === 0 && (
                        <span className="text-xs text-muted-foreground">Tanlangan oraliqda reys yo'q.</span>
                    )}
                    {[...history.tripStats.map((trip) => ({
                        key: trip.key,
                        color: trip.color,
                        index: String(trip.index + 1) as string | null,
                        from: trip.from ?? "Reys",
                        to: trip.to ?? "",
                        km: trip.km,
                        ms: trip.end - trip.start,
                    })), {
                        key: "idle",
                        color: STATUS_META[IDLE].color,
                        index: String(history.tripStats.length + 1) as string | null,
                        from: "Reysdan tashqari",
                        to: "",
                        km: history.idleKm,
                        ms: history.idleMs,
                    }].map((row) => {
                        const selected = history.focus?.kind === "trip" && history.focus.key === row.key
                        return (
                            <button
                                type="button"
                                key={row.key}
                                onClick={() => history.setFocus(selected ? null : { kind: "trip", key: row.key })}
                                className={cn(
                                    "grid w-full grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-1.5 gap-y-0.5 rounded-md border border-muted-foreground/30 px-2.5 py-2 text-left transition hover:bg-accent/50",
                                    selected && "border-primary/60 bg-primary/5 ring-1 ring-primary/20",
                                    history.focus && !selected && "opacity-60",
                                )}
                            >
                                <span className="text-sm font-semibold text-muted-foreground">{row.index}.</span>
                                <span className="col-span-3 flex min-w-0 items-center gap-2 text-sm font-medium">
                                    <span className="min-w-0 truncate">{row.to ? `${row.from} – ${row.to}` : row.from}</span>
                                    <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: row.color }} />
                                </span>
                                <span />
                                <span className="truncate font-mono text-xs tabular-nums text-muted-foreground">{row.km.toFixed(1)} km</span>
                                <span className="text-center text-muted-foreground/30">|</span>
                                <span className="flex items-center justify-end gap-2 font-mono text-xs tabular-nums text-muted-foreground">
                                    {spanLabel(row.ms)}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}
            {history.bySpeed && (
                <div className="flex flex-col gap-1 px-1 pt-3">
                    <div className="h-1.5 rounded-full" style={{ background: SPEED_LEGEND }} />
                    <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                        <span>0–{SPEED_STOPS[0][0]}</span>
                        <span>{SPEED_STOPS[1][0]}</span>
                        <span>{SPEED_STOPS[2][0]}+ km/h</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export function TrackerHeader({ tracker, onBack }: { tracker: GpsLiveVehicle; onBack: () => void }) {
    const { t } = useTranslation()
    const online = tracker.status === "online"
    return (
        <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={onBack} aria-label={t("page.back_to_list")}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-mono text-base font-bold tracking-wide">
                        {tracker.vehicle_number || tracker.tracker_name || tracker.imei}
                    </span>
                    <Badge
                        variant="outline"
                        className={cn("ml-auto shrink-0", online ? "border-emerald-500/40 text-emerald-500" : "text-muted-foreground")}
                    >
                        {online ? "Onlayn" : "Oflayn"}
                    </Badge>
                </div>
                {tracker.driver_name && (
                    <p className="truncate text-sm font-medium text-muted-foreground">{tracker.driver_name}</p>
                )}
                <p className="truncate text-xs font-normal text-muted-foreground">
                    {tracker.last_update ? `Oxirgi signal ${clock(Date.parse(tracker.last_update))}` : ""}
                    {tracker.speed != null ? `, ${Math.round(tracker.speed)} km/h` : ""}
                </p>
            </div>
        </div>
    )
}

export function TrackerHistoryPanel({ history, children }: PanelProps) {
    const { days, range, summary } = history
    const today = dayKey(Date.now())
    const rangeDays = range ? days.filter((d) => d.date >= range.from && d.date <= range.to) : []

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                    <DatePickerWithRange
                        dateFormat="dd.MM"
                        addButtonProps={{ className: "overflow-hidden px-3" }}
                        date={range ? { from: keyToDate(range.from), to: keyToDate(range.to) } : undefined}
                        setDate={(value) => {
                            if (!value?.from) return
                            history.setRange({
                                from: localKey(value.from),
                                to: localKey(value.to ?? value.from),
                            })
                        }}
                    />
                </div>
                <div className="w-24 shrink-0">
                    <ColorBySelect history={history} part="header" />
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
                <ColorBySelect history={history} part="legend" />
                {history.daysLoading && <p className="text-xs text-muted-foreground">Yuklanmoqda…</p>}
                {!history.daysLoading && days.length === 0 && (
                    <p className="text-xs text-muted-foreground">Bu qurilma hali joylashuv yubormagan.</p>
                )}
                {!history.daysLoading && days.length > 0 && rangeDays.length === 0 && (
                    <p className="text-xs text-muted-foreground">Tanlangan oraliqda harakat yo'q.</p>
                )}
                {history.colorBy === "day" && rangeDays.map((d) => {
                    return (
                        <button
                            type="button"
                            key={d.date}
                            onClick={() => history.setFocus(history.focusDay === d.date ? null : { kind: "day", key: d.date })}
                            className={cn(
                                "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 rounded-md border border-muted-foreground/30 px-3 py-2 text-left transition hover:bg-accent/50",
                                history.focusDay === d.date && "border-primary/60 bg-primary/5 ring-1 ring-primary/20",
                                history.focus && history.focusDay !== d.date && "opacity-60",
                            )}
                        >
                            <span className="whitespace-nowrap text-sm font-medium">{d.date.split("-").reverse().join(".")}</span>
                            <span className="inline-flex items-center gap-3 font-mono text-sm font-semibold tabular-nums">
                                {d.distance_km.toFixed(1)} km
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: history.colors[d.date] }} />
                            </span>
                        </button>
                    )
                })}
                {children}
            </div>
        </div>
    )
}
