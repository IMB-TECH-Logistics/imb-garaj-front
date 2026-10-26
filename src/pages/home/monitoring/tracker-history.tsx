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
import { type ReactNode, useEffect, useMemo, useRef, useState, useCallback } from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import type { ColoredSegment, MapPoi, MapPoint } from "./route-map"
import { type ReplayStatus, useRouteReplay } from "./route-replay"
import { useRouteDraw } from "./route-draw"
import { ACTIVE_STATUSES, IDLE, STATUS_META, ROW_KIND_STATUS } from "./status/data"
import { findGaps, gapKey, useGapRoutes } from "./gap-routes"
import type { GpsDay, GpsLiveVehicle, GpsPosition } from "./types"

const TZ = "Asia/Tashkent"
const TZ_OFFSET_MS = 5 * 3600 * 1000
const GAP_MS = 15 * 60 * 1000
const STOP_MIN_MS = 20 * 60 * 1000
const STOP_MERGE_M = 100
const MAX_REAL_SPEED = 150
const OUTSIDE_TRIP_COLOR = "#ff00d4"
const DISTINCT_COLORS = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7", "#ec4899",
    "#14b8a6", "#f97316", "#84cc16", "#6366f1", "#eab308", "#06b6d4",
]

const hslToHex = (h: number, s: number, l: number) => {
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => {
        const k = (n + h / 30) % 12
        return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0")
    }
    return `#${f(0)}${f(8)}${f(4)}`
}

const distinctColor = (index: number) =>
    index < DISTINCT_COLORS.length ? DISTINCT_COLORS[index] : hslToHex((index * 137.508) % 360, 0.7, 0.55)

type Point = { t: number; lat: number; lng: number; speed: number; day: string }
type Stop = { from: number; to: number; lat: number; lng: number }
type DayRange = { from: string; to: string }

const timeFormat = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })

const LIVE_HISTORY_MS = 30_000
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

function dayParts(key: string, t: TFunction) {
    const d = new Date(`${key}T00:00:00Z`)
    return { name: `${d.getUTCDate()} ${t(`mon.months.${d.getUTCMonth()}`)}` }
}

function spanLabel(ms: number, t: TFunction) {
    const minutes = Math.round(ms / 60000)
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    if (days) return t("mon.duration.dh_short", { d: days, h: hours })
    return hours
        ? t("mon.duration.hm_short", { h: hours, m: minutes % 60 })
        : t("mon.duration.m_short", { m: minutes % 60 })
}

function shortDuration(ms: number, t: TFunction) {
    const minutes = Math.round(ms / 60000)
    const hours = Math.floor(minutes / 60)
    return hours
        ? t("mon.duration.hm_short", { h: hours, m: minutes % 60 })
        : t("mon.duration.m_short", { m: minutes })
}

function duration(ms: number, t: TFunction) {
    const minutes = Math.round(ms / 60000)
    const hours = Math.floor(minutes / 60)
    return hours
        ? t("monitoring_stats.hours_minutes", { h: hours, m: minutes % 60 })
        : t("monitoring_stats.minutes", { m: minutes })
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

function splitKmByDay(points: Point[], km: number, fallbackDay: string, whole: boolean) {
    const metresByDay: Record<string, number> = {}
    let total = 0
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]
        const b = points[i]
        const dt = b.t - a.t
        if (dt <= 0 || dt > GAP_MS) continue
        const d = metres(a, b)
        if ((d / dt) * 3600 >= 180) continue
        metresByDay[b.day] = (metresByDay[b.day] ?? 0) + d
        total += d
    }
    if (total === 0) return whole ? { [fallbackDay]: km } : {}
    const perMetre = whole ? km / total : 1 / 1000
    return Object.fromEntries(Object.entries(metresByDay).map(([day, d]) => [day, d * perMetre]))
}

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
        maxSpeed: points.reduce((max, p) => (p.speed <= MAX_REAL_SPEED ? Math.max(max, p.speed) : max), 0),
    }
}

export type ColorBy = "day" | "trip" | "status" | "speed"

export const COLOR_BY_OPTIONS: { value: ColorBy; labelKey: string }[] = [
    { value: "day", labelKey: "mon.color_by.day" },
    { value: "trip", labelKey: "mon.color_by.trip" },
    { value: "speed", labelKey: "mon.color_by.speed" },
]


type TripSpan = { key: string; start: number; end: number; color: string; index: number; from?: string | null; to?: string | null; routeKm?: number | null; kind?: string | null; fuel?: number | null; externalId?: string | null }

const STAGE_ORDER: Record<number, number> = { 0: 0, 1: 1, 5: 2, 6: 3, 7: 4 }

function groupTrips(statuses: ReplayStatus[]): TripSpan[] {
    const sorted = [...statuses].sort((a, b) => a.start - b.start)
    const trips: TripSpan[] = []
    const byOrder = new Map<number, TripSpan>()
    let previous: ReplayStatus | null = null
    const byRow = new Map<string, TripSpan>()
    for (const seg of sorted) {
        if (seg.rowKey) {
            const row = byRow.get(seg.rowKey)
            if (row) {
                row.start = Math.min(row.start, seg.start)
                row.end = Math.max(row.end, seg.end)
            } else {
                const span: TripSpan = {
                    key: seg.rowKey,
                    start: seg.start,
                    end: seg.end,
                    color: "",
                    index: 0,
                    from: seg.from ?? null,
                    to: seg.to ?? null,
                    routeKm: seg.routeKm ?? null,
                    kind: seg.kind ?? null,
                    fuel: seg.fuel ?? null,
                    externalId: seg.externalId ?? null,
                }
                trips.push(span)
                byRow.set(seg.rowKey, span)
            }
            continue
        }
        const own = seg.order != null ? byOrder.get(seg.order) : undefined
        const last = trips[trips.length - 1]
        const continues =
            !own &&
            seg.order == null &&
            last &&
            previous &&
            previous.order == null &&
            seg.start - previous.end <= 60 * 1000 &&
            (STAGE_ORDER[seg.status] ?? 0) >= (STAGE_ORDER[previous.status] ?? 0)
        const target = own ?? (continues ? last : undefined)
        if (target) {
            target.start = Math.min(target.start, seg.start)
            target.end = Math.max(target.end, seg.end)
            target.routeKm = target.routeKm ?? seg.routeKm ?? null
        } else {
            const span: TripSpan = {
                key: seg.order != null ? `o${seg.order}` : `r${trips.length}`,
                start: seg.start,
                end: seg.end,
                color: "",
                index: 0,
                from: seg.from ?? null,
                to: seg.to ?? null,
                routeKm: seg.routeKm ?? null,
            }
            trips.push(span)
            if (seg.order != null) byOrder.set(seg.order, span)
        }
        previous = seg
    }
    trips.sort((a, b) => a.start - b.start)
    let reysIndex = 0
    trips.forEach((trip) => {
        if (trip.kind && trip.kind !== "reys") {
            trip.index = -1
            trip.color = STATUS_META[ROW_KIND_STATUS[trip.kind as keyof typeof ROW_KIND_STATUS]]?.color ?? OUTSIDE_TRIP_COLOR
            return
        }
        trip.index = reysIndex
        trip.color = distinctColor(reysIndex)
        reysIndex += 1
    })
    return trips
}

export type Focus = { kind: "day" | "trip" | "status"; key: string }

export function useTrackerHistory(imei: string | null) {
    const { t: tr } = useTranslation()
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

    const trips = useMemo(() => groupTrips(statusSegments), [statusSegments])
    const focusTrip = focus?.kind === "trip" ? trips.find((x) => x.key === focus.key) : undefined
    const span = useMemo(() => {
        if (!range) return null
        const from = Math.min(Date.parse(`${range.from}T00:00:00+05:00`), focusTrip?.start ?? Infinity)
        const to = Math.max(Date.parse(`${range.to}T23:59:59+05:00`), focusTrip ? Math.min(focusTrip.end, Date.now()) : -Infinity)
        return { from, to }
    }, [range, focusTrip?.start, focusTrip?.end])

    const [replayActive, setReplayActive] = useState(false)
    const live = !!range && range.to >= dayKey(Date.now()) && !replayActive
    const positions = useGet<GpsPosition[]>(MONITORING_GPS_HISTORY, {
        params: {
            imei,
            from: span ? new Date(span.from).toISOString() : undefined,
            to: span ? new Date(span.to).toISOString() : undefined,
        },
        enabled: !!imei && !!range,
        options: {
            refetchInterval: live ? LIVE_HISTORY_MS : false,
            refetchIntervalInBackground: false,
        },
    })

    const colors = useMemo<Record<string, string>>(
        () => Object.fromEntries((days.data ?? []).map((d, i) => [d.date, distinctColor(i)])),
        [days.data],
    )

    const track = useMemo<Point[]>(
        () => (positions.data ?? []).map(toPoint).filter((p) => !!span && p.t >= span.from && p.t <= span.to),
        [positions.data, span],
    )
    const points = useMemo<Point[]>(
        () => track.filter((p) => !!range && p.day >= range.from && p.day <= range.to),
        [track, range],
    )

    const summary = useMemo(() => summarize(points), [points])
    const trackSummary = useMemo(() => (track.length === points.length ? summary : summarize(track)), [track, points, summary])

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
                if (focus.key.startsWith("gap:")) {
                    const [, from, to] = focus.key.split(":").map(Number)
                    return !trip && t >= from && t <= to
                }
                return focus.key === "idle" ? !trip : trip?.key === focus.key
            }
            const seg = statusSegments.find((x) => t >= x.start && t < x.end && STATUS_META[x.status])
            return focus.key === "idle" ? !seg : String(seg?.status) === focus.key
        },
        [focus, trips, statusSegments],
    )

    const replayPoints = useMemo(() => (focus ? track.filter((p) => inFocus(p.t)) : points), [track, points, focus, inFocus])
    const replay = useRouteReplay(replayPoints)
    useEffect(() => {
        setReplayActive(replay.active)
    }, [replay.active])

    const dim = (t: number) => (inFocus(t) ? 1 : 0.22)

    const tripStats = useMemo(
        () =>
            trips.map((trip) => {
                const inTrip = points.filter((p) => p.t >= trip.start && p.t < trip.end)
                const km = trip.routeKm ?? (trip.kind && trip.kind !== "reys" ? 0 : summarize(inTrip).distance / 1000)
                const whole = !!range && dayKey(trip.start) >= range.from && dayKey(trip.end) <= range.to
                const dayKm = km ? splitKmByDay(inTrip, km, dayKey(trip.start), whole) : {}
                const visibleKm = whole ? km : Object.values(dayKm).reduce((sum, v) => sum + v, 0)
                const from = range ? Math.max(trip.start, Date.parse(`${range.from}T00:00:00+05:00`)) : trip.start
                const to = range ? Math.min(trip.end, Date.parse(`${range.to}T23:59:59+05:00`) + 1000) : trip.end
                return { ...trip, km, dayKm, whole, visibleKm, visibleMs: Math.max(0, to - from) }
            }),
        [trips, points, range],
    )
    const gaps = useMemo(() => findGaps(track, GAP_MS), [track])
    const roads = useGapRoutes(gaps)
    const drawPoints = useMemo<Point[]>(() => {
        if (gaps.length === 0) return track
        const byEnd = new Map(gaps.map((g) => [g.to.t, g]))
        const out: Point[] = []
        for (const p of track) {
            const gap = byEnd.get(p.t)
            const road = (gap && roads?.get(gapKey(gap))) || []
            road.forEach(([lng, lat], i) => {
                const t = gap!.from.t + ((p.t - gap!.from.t) * (i + 1)) / (road.length + 1)
                out.push({ t, lat, lng, speed: 0, day: dayKey(t) })
            })
            out.push(p)
        }
        return out
    }, [track, gaps, roads])

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
            if (key === "idle") return colorBy === "trip" ? OUTSIDE_TRIP_COLOR : idleColor
            if (colorBy === "status") return STATUS_META[Number(key.slice(1))].color
            if (colorBy === "trip") return trips.find((x) => x.key === key)?.color ?? OUTSIDE_TRIP_COLOR
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
        drawPoints.forEach((p, i) => {
            if (focus && !inFocus(p.t)) {
                flush()
                currentKey = ""
                return
            }
            const previous = drawPoints[i - 1]
            const key = `${bySpeed ? "speed" : keyOf(p)}|${inFocus(p.t) ? 1 : 0}`
            if (previous && key !== currentKey && current.length > 0) {
                const last = current[current.length - 1]
                flush()
                current.push(last)
            }
            currentKey = key
            current.push(p)
        })
        flush()
        return out
    }, [drawPoints, bySpeed, colors, colorBy, statusSegments, trips, inFocus, focus])

    const drawnSegments = useRouteDraw(
        segments,
        `${imei}|${span?.from}|${span?.to}`,
        !!range && !positions.isFetching && track.length > 1,
        replay.active,
    )

    const bboxKey = `${imei}|${range?.from}|${range?.to}|${focus?.kind}:${focus?.key}`
    const framed = useRef<{ key: string; bbox: [number, number, number, number] } | null>(null)
    const bbox = useMemo<[number, number, number, number] | null>(() => {
        if (framed.current?.key === bboxKey) return framed.current.bbox
        const scope = focus ? track.filter((p) => inFocus(p.t)) : points
        if (scope.length === 0) return null
        const lngs = scope.map((p) => p.lng)
        const lats = scope.map((p) => p.lat)
        const next: [number, number, number, number] = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]
        framed.current = { key: bboxKey, bbox: next }
        return next
    }, [track, points, focus, inFocus, bboxKey])

    const stopGroups = useMemo(() => {
        const groups: { lat: number; lng: number; stops: Stop[] }[] = []
        for (const stop of trackSummary.stops) {
            const here = { lat: stop.lat, lng: stop.lng } as Point
            const group = groups.find((g) => metres({ lat: g.lat, lng: g.lng } as Point, here) <= STOP_MERGE_M)
            if (group) group.stops.push(stop)
            else groups.push({ lat: stop.lat, lng: stop.lng, stops: [stop] })
        }
        return groups
    }, [trackSummary.stops])

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
        ? groupView.flatMap((g, i) => (focus && g.focused.length === 0 ? [] : [{
              id: `stop-${i}`,
              lat: g.lat,
              lng: g.lng,
              kind: "stop" as const,
              dimmed: g.focused.length === 0,
              label: shortDuration(g.total, tr),
              highlight: longest.has(g),
              onClick: () => replay.seek((g.focused[0] ?? g.stops[0]).from),
              title: g.stops
                  .map((x) => `${dayParts(dayKey(x.from), tr).name} ${clock(x.from)}–${clock(x.to)}, ${duration(x.to - x.from, tr)}`)
                  .join("\n"),
          }]))
        : []

    const visiblePoints = focus ? replayPoints : points
    const first = visiblePoints[0]
    const last = visiblePoints[visiblePoints.length - 1]

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
        setStatusSegments,
        live,
        trips,
        showStops,
        setShowStops,
        map: {
            segments: drawnSegments,
            bbox,
            points: first && last && visiblePoints.length > 1 ? ([[first.lng, first.lat], [last.lng, last.lat]] as MapPoint[]) : undefined,
            pois,
            arrows: focus ? focus.kind === "day" || focus.kind === "trip" : !!range && range.from === range.to,
        },
    }
}

export type TrackerHistory = ReturnType<typeof useTrackerHistory>

type PanelProps = {
    history: TrackerHistory
    children?: ReactNode
}

export function ColorBySelect({ history, part }: { history: TrackerHistory; part: "header" | "legend" }) {
    const { t } = useTranslation()
    if (part === "header") {
        return (
            <div className="text-sm">
                <div className="w-full">
                    <Select
                        value={history.colorBy}
                        setValue={(value) => history.setColorBy(value as ColorBy)}
                        options={COLOR_BY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
                        label={t("mon.history.line_color")}
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
                        <span className="text-xs text-muted-foreground">{t("mon.history.no_trips")}</span>
                    )}
                    {[...history.tripStats.map((trip) => {
                        const kindStatus = trip.kind && trip.kind !== "reys" ? ROW_KIND_STATUS[trip.kind as keyof typeof ROW_KIND_STATUS] : null
                        const label = kindStatus != null ? t(STATUS_META[kindStatus].labelKey) : null
                        const route = trip.to && trip.to !== trip.from ? `${trip.from} – ${trip.to}` : trip.from ?? ""
                        return {
                            key: trip.key,
                            start: trip.start,
                            color: trip.color,
                            index: trip.index >= 0 ? String(trip.index + 1) : null,
                            from: label ? `${label}${route ? ` · ${route}` : ""}` : `${trip.externalId ? `${trip.externalId} · ` : ""}${trip.from ?? t("mon.trip")}`,
                            to: label ? "" : trip.to ?? "",
                            km: trip.visibleKm,
                            totalKm: trip.whole ? null : trip.km,
                            fuel: trip.whole ? trip.fuel ?? null : null,
                            ms: trip.visibleMs,
                            totalMs: trip.whole ? null : trip.end - trip.start,
                        }
                    })].sort((a, b) => a.start - b.start).map((row) => {
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
                                <span className="text-sm font-semibold text-muted-foreground">{row.index ? `${row.index}.` : "–"}</span>
                                <span className="col-span-3 flex min-w-0 items-center gap-2 text-sm font-medium">
                                    <span className="min-w-0 truncate">{row.to ? `${row.from} – ${row.to}` : row.from}</span>
                                    <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: row.color }} />
                                </span>
                                <span />
                                <span
                                    className="truncate font-mono text-xs tabular-nums text-muted-foreground"
                                    title={row.totalKm ? `${t("mon.history.trip_total")}: ${row.totalKm.toFixed(1)} ${t("mon.units.km")} · ${spanLabel(row.totalMs ?? 0, t)}` : undefined}
                                >
                                    {row.km ? `${row.km.toFixed(1)} ${t("mon.units.km")}` : "—"}
                                    {row.fuel ? ` · ${row.fuel.toFixed(1)} m³` : ""}
                                </span>
                                <span className="text-center text-muted-foreground/30">|</span>
                                <span className="flex items-center justify-end gap-2 font-mono text-xs tabular-nums text-muted-foreground">
                                    {spanLabel(row.ms, t)}
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
                        <span>{SPEED_STOPS[2][0]}+ {t("mon.units.kmh")}</span>
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
                        {online ? t("status.online") : t("status.offline")}
                    </Badge>
                </div>
                {tracker.driver_name && (
                    <p className="truncate text-sm font-medium text-muted-foreground">{tracker.driver_name}</p>
                )}
                <p className="truncate text-xs font-normal text-muted-foreground">
                    {tracker.last_update ? t("mon.history.last_signal", { time: clock(Date.parse(tracker.last_update)) }) : ""}
                    {tracker.speed != null ? `, ${Math.round(tracker.speed)} ${t("mon.units.kmh")}` : ""}
                </p>
            </div>
        </div>
    )
}

export function TrackerHistoryPanel({ history, children }: PanelProps) {
    const { t } = useTranslation()
    const { days, range, summary } = history
    const today = dayKey(Date.now())
    const rangeDays = range ? days.filter((d) => d.date >= range.from && d.date <= range.to) : []
    const dayKm = useMemo(() => {
        const out: Record<string, number> = {}
        for (const trip of history.tripStats) {
            for (const [day, km] of Object.entries(trip.dayKm)) out[day] = (out[day] ?? 0) + km
        }
        return out
    }, [history.tripStats])

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                    <DatePickerWithRange
                        dateFormat="dd.MM"
                        startFreshOnOpen
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
                {history.daysLoading && <p className="text-xs text-muted-foreground">{t("mon.history.loading")}</p>}
                {!history.daysLoading && days.length === 0 && (
                    <p className="text-xs text-muted-foreground">{t("mon.history.no_location")}</p>
                )}
                {!history.daysLoading && days.length > 0 && rangeDays.length === 0 && (
                    <p className="text-xs text-muted-foreground">{t("mon.history.no_movement")}</p>
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
                            <span
                                className="inline-flex items-center gap-3 font-mono text-sm font-semibold tabular-nums"
                                title={`GPS: ${d.distance_km.toFixed(1)} ${t("mon.units.km")}`}
                            >
                                {(dayKm[d.date] ?? 0).toFixed(1)} {t("mon.units.km")}
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
