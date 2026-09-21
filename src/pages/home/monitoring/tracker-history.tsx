import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
    MONITORING_GPS_HISTORY,
    MONITORING_GPS_HISTORY_DAYS,
} from "@/constants/api-endpoints"
import { buildQueryKey, getRequest, useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { useQueries } from "@tanstack/react-query"
import { ArrowLeft, Pause, Play } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { ColoredSegment, MapPoi, MapPoint } from "./route-map"
import type { GpsDay, GpsLiveVehicle, GpsPosition } from "./types"

const TZ = "Asia/Tashkent"
const TZ_OFFSET_MS = 5 * 3600 * 1000
const DAY_MS = 86400 * 1000
const GAP_MS = 15 * 60 * 1000
const STOP_MIN_MS = 5 * 60 * 1000
const DAY_COLORS = ["#5eb3f6", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#fb7185", "#22d3ee"]
const RATES = [1, 2, 4, 8]
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"]
const WEEKDAYS = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"]

type Point = { t: number; lat: number; lng: number; speed: number; day: string }
type Stop = { from: number; to: number; lat: number; lng: number }

const timeFormat = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
const secondsFormat = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit" })

const dayKey = (ms: number) => new Date(ms + TZ_OFFSET_MS).toISOString().slice(0, 10)

function toPoint(p: GpsPosition): Point {
    const t = Date.parse(p.fix_time)
    return { t, lat: p.latitude, lng: p.longitude, speed: p.speed ?? 0, day: dayKey(t) }
}

function splitByGaps(points: Point[]) {
    const parts: Point[][] = []
    let current: Point[] = []
    points.forEach((p, i) => {
        const previous = points[i - 1]
        if (previous && (p.t - previous.t > GAP_MS || p.day !== previous.day)) {
            parts.push(current)
            current = []
        }
        current.push(p)
    })
    parts.push(current)
    return parts.filter((part) => part.length > 1)
}
const clock = (ms: number) => timeFormat.format(ms)

function dayParts(key: string) {
    const d = new Date(`${key}T00:00:00Z`)
    return { name: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`, weekday: WEEKDAYS[d.getUTCDay()] }
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

const SPEED_LIMIT_KMH = 60

function speedColor(speed: number) {
    return speed < SPEED_LIMIT_KMH ? "#10b981" : "#f43f5e"
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
        maxSpeed: points.reduce((max, p) => Math.max(max, p.speed), 0),
    }
}

export function useTrackerHistory(imei: string | null) {
    const days = useGet<GpsDay[]>(MONITORING_GPS_HISTORY_DAYS, {
        params: { imei },
        enabled: !!imei,
    })
    const [selected, setSelected] = useState<string[]>([])
    const [initialisedFor, setInitialisedFor] = useState<string | null>(null)
    const [bySpeed, setBySpeed] = useState(false)
    const [showStops, setShowStops] = useState(true)
    const [index, setIndex] = useState(0)
    const [playing, setPlaying] = useState(false)
    const [started, setStarted] = useState(false)
    const [rate, setRate] = useState(4)

    useEffect(() => {
        if (imei && days.data?.length && initialisedFor !== imei) {
            setSelected([days.data[0].date])
            setInitialisedFor(imei)
        }
        if (!imei) {
            setSelected([])
            setInitialisedFor(null)
        }
    }, [imei, days.data, initialisedFor])

    const sortedDays = [...selected].sort()
    const range = sortedDays.length
        ? { from: `${sortedDays[0]}T00:00:00+05:00`, to: `${sortedDays[sortedDays.length - 1]}T23:59:59+05:00` }
        : null

    const positions = useGet<GpsPosition[]>(MONITORING_GPS_HISTORY, {
        params: { imei, from: range?.from, to: range?.to },
        enabled: !!imei && !!range,
    })

    const colors = useMemo<Record<string, string>>(
        () => Object.fromEntries((days.data ?? []).map((d, i) => [d.date, DAY_COLORS[i % DAY_COLORS.length]])),
        [days.data],
    )

    const points = useMemo<Point[]>(
        () =>
            (positions.data ?? []).map(toPoint).filter((p) => selected.includes(p.day)),
        [positions.data, selected],
    )

    const summary = useMemo(() => summarize(points), [points])

    useEffect(() => {
        setIndex(0)
        setPlaying(false)
        setStarted(false)
    }, [points])

    useEffect(() => {
        if (!playing) return
        if (index >= points.length - 1) {
            setPlaying(false)
            return
        }
        const timer = setTimeout(() => setIndex((i) => i + 1), 400 / rate)
        return () => clearTimeout(timer)
    }, [playing, index, rate, points.length])

    const segments = useMemo<ColoredSegment[]>(() => {
        const out: ColoredSegment[] = []
        let current: Point[] = []
        const flush = () => {
            if (current.length > 1) {
                if (bySpeed) {
                    for (let i = 1; i < current.length; i++) {
                        const a = current[i - 1]
                        const b = current[i]
                        out.push({ points: [[a.lng, a.lat], [b.lng, b.lat]], color: speedColor(Math.max(a.speed, b.speed)) })
                    }
                } else {
                    out.push({ points: current.map((p) => [p.lng, p.lat] as MapPoint), color: colors[current[0].day] })
                }
            }
            current = []
        }
        points.forEach((p, i) => {
            const previous = points[i - 1]
            if (previous && (p.t - previous.t > GAP_MS || p.day !== previous.day)) flush()
            current.push(p)
        })
        flush()
        return out
    }, [points, bySpeed, colors])

    const bbox = useMemo<[number, number, number, number] | null>(() => {
        if (points.length === 0) return null
        const lngs = points.map((p) => p.lng)
        const lats = points.map((p) => p.lat)
        return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]
    }, [points])

    const current = points[index]
    const pois: MapPoi[] = [
        ...(showStops
            ? summary.stops.map((s, i) => ({
                  id: `stop-${i}`,
                  lat: s.lat,
                  lng: s.lng,
                  kind: "stop" as const,
                  title: `To'xtash ${clock(s.from)}–${clock(s.to)}, ${duration(s.to - s.from)}`,
              }))
            : []),
        ...(started && current
            ? [{ id: "replay", lat: current.lat, lng: current.lng, kind: "replay" as const, title: secondsFormat.format(current.t) }]
            : []),
    ]

    const first = points[0]
    const last = points[points.length - 1]

    return {
        days: days.data ?? [],
        daysLoading: days.isLoading,
        loading: positions.isFetching,
        selected,
        colors,
        points,
        summary,
        bySpeed,
        setBySpeed,
        showStops,
        setShowStops,
        toggleDay: (key: string) =>
            setSelected((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key])),
        selectDays: (keys: string[]) => setSelected(keys),
        replay: {
            index,
            playing,
            rate,
            current,
            setRate,
            play: () => {
                if (index >= points.length - 1) setIndex(0)
                setStarted(true)
                setPlaying(true)
            },
            pause: () => setPlaying(false),
            seek: (i: number) => {
                setStarted(true)
                setPlaying(false)
                setIndex(i)
            },
        },
        map: {
            segments,
            bbox,
            points: first && last && points.length > 1 ? ([[first.lng, first.lat], [last.lng, last.lat]] as MapPoint[]) : undefined,
            pois,
        },
    }
}

export type TrackerHistory = ReturnType<typeof useTrackerHistory>

export function useLiveTrails(items: GpsLiveVehicle[], enabled: boolean) {
    const today = dayKey(Date.now())
    const range = { from: `${today}T00:00:00+05:00`, to: `${today}T23:59:59+05:00` }
    const imeis = items.map((item) => item.imei)

    const history = useQueries({
        queries: imeis.map((imei) => ({
            queryKey: buildQueryKey(MONITORING_GPS_HISTORY, { imei, ...range }),
            queryFn: (): Promise<GpsPosition[]> =>
                getRequest(MONITORING_GPS_HISTORY, { params: { imei, ...range } }),
            enabled,
            staleTime: 5 * 60 * 1000,
        })),
    })

    const [live, setLive] = useState<Record<string, Point[]>>({})

    useEffect(() => {
        if (!enabled) return
        setLive((previous) => {
            let next = previous
            for (const item of items) {
                if (item.lat == null || item.lng == null || !item.fix_time) continue
                const t = Date.parse(item.fix_time)
                const trail = previous[item.imei] ?? []
                if (trail.length && trail[trail.length - 1].t >= t) continue
                if (next === previous) next = { ...previous }
                next[item.imei] = [...trail, { t, lat: item.lat, lng: item.lng, speed: item.speed ?? 0, day: dayKey(t) }]
            }
            return next
        })
    }, [items, enabled])

    const loadedAt = history.map((q) => q.dataUpdatedAt).join(",")

    return useMemo<ColoredSegment[]>(() => {
        if (!enabled) return []
        return imeis.flatMap((imei, i) => {
            const loaded = (history[i]?.data ?? []).map(toPoint)
            const lastLoaded = loaded.length ? loaded[loaded.length - 1].t : 0
            const trail = [...loaded, ...(live[imei] ?? []).filter((p) => p.t > lastLoaded && p.day === today)]
            return splitByGaps(trail).map((part) => ({
                points: part.map((p) => [p.lng, p.lat] as MapPoint),
                color: DAY_COLORS[i % DAY_COLORS.length],
            }))
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, imeis.join(","), loadedAt, live, today])
}

type PanelProps = {
    tracker: GpsLiveVehicle
    history: TrackerHistory
    onBack: () => void
}

export function TrackerHistoryPanel({ tracker, history, onBack }: PanelProps) {
    const { days, selected, summary } = history
    const online = tracker.status === "online"
    const today = dayKey(Date.now())
    const yesterday = dayKey(Date.now() - DAY_MS)
    const quick = [
        { label: "Bugun", keys: days.some((d) => d.date === today) ? [today] : [] },
        { label: "Kecha", keys: days.some((d) => d.date === yesterday) ? [yesterday] : [] },
        { label: "Hammasi", keys: days.map((d) => d.date) },
    ]

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={onBack} aria-label="Ro'yxatga qaytish">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-base font-bold tracking-wide">
                            {tracker.vehicle_number || tracker.tracker_name || tracker.imei}
                        </span>
                        <Badge
                            variant="outline"
                            className={cn(online ? "border-emerald-500/40 text-emerald-500" : "text-muted-foreground")}
                        >
                            {online ? "Onlayn" : "Oflayn"}
                        </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                        IMEI {tracker.imei}
                        {tracker.last_update ? ` · oxirgi signal ${clock(Date.parse(tracker.last_update))}` : ""}
                        {tracker.speed != null ? `, ${Math.round(tracker.speed)} km/h` : ""}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {[
                    [(summary.distance / 1000).toFixed(1), "km"],
                    [String(Math.round(summary.maxSpeed)), "max km/h"],
                    [duration(summary.moving), "harakatda"],
                    [String(summary.stops.length), "to'xtash"],
                ].map(([value, label]) => (
                    <div key={label} className="rounded-md border px-2.5 py-2">
                        <div className="font-mono text-sm font-bold tabular-nums">{value}</div>
                        <div className="text-[11px] text-muted-foreground">{label}</div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kunlar</span>
                <span className="flex-1" />
                {quick.map((q) => (
                    <Button
                        key={q.label}
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-full px-3 text-xs"
                        disabled={q.keys.length === 0}
                        onClick={() => history.selectDays(q.keys)}
                    >
                        {q.label}
                    </Button>
                ))}
            </div>

            <div className="flex flex-col gap-1.5">
                {history.daysLoading && <p className="text-xs text-muted-foreground">Yuklanmoqda…</p>}
                {!history.daysLoading && days.length === 0 && (
                    <p className="text-xs text-muted-foreground">Bu qurilma hali joylashuv yubormagan.</p>
                )}
                {days.map((d) => {
                    const { name, weekday } = dayParts(d.date)
                    return (
                        <label
                            key={d.date}
                            className="grid cursor-pointer grid-cols-[auto_auto_1fr_auto] items-center gap-2.5 rounded-md border px-3 py-2 hover:bg-accent"
                        >
                            <Checkbox checked={selected.includes(d.date)} onCheckedChange={() => history.toggleDay(d.date)} />
                            <span className="h-1 w-3 rounded-full" style={{ background: history.colors[d.date] }} />
                            <span className="text-sm font-medium">
                                {name}, {weekday}
                                <span className="block text-xs font-normal text-muted-foreground">
                                    {clock(Date.parse(d.first))} – {clock(Date.parse(d.last))} · {d.points} nuqta
                                </span>
                            </span>
                            <span className="font-mono text-sm font-semibold tabular-nums">{d.distance_km.toFixed(1)} km</span>
                        </label>
                    )
                })}
            </div>

            <div className="flex flex-col gap-2 text-sm">
                <label className="flex items-center justify-between">
                    Tezlik bo'yicha rang
                    <Switch checked={history.bySpeed} onCheckedChange={history.setBySpeed} />
                </label>
                <label className="flex items-center justify-between">
                    To'xtashlarni ko'rsatish
                    <Switch checked={history.showStops} onCheckedChange={history.setShowStops} />
                </label>
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    To'xtashlar ({summary.stops.length})
                </span>
                {summary.stops.length === 0 && (
                    <p className="text-xs text-muted-foreground">Tanlangan kunlarda 5 daqiqadan uzun to'xtash yo'q.</p>
                )}
                {summary.stops.map((s, i) => (
                    <div key={i} className="grid grid-cols-[22px_1fr_auto] items-center gap-2.5 rounded-md px-2 py-1.5 text-xs">
                        <span className="grid h-5 w-5 place-items-center rounded bg-amber-500 font-mono text-[11px] font-bold text-amber-950">P</span>
                        <span>
                            {dayKey(s.from) === today ? "" : `${dayParts(dayKey(s.from)).name}, `}
                            {clock(s.from)} – {clock(s.to)}
                        </span>
                        <span className="font-mono text-muted-foreground">{duration(s.to - s.from)}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function ReplayBar({ history }: { history: TrackerHistory }) {
    const { points, replay } = history
    if (points.length < 2) return null
    const p = replay.current ?? points[0]

    return (
        <div className="absolute bottom-7 left-4 z-10 flex w-[min(620px,calc(100%-6rem))] items-center gap-3 rounded-xl border bg-card/95 p-2.5 shadow-xl backdrop-blur">
            <Button
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full"
                onClick={replay.playing ? replay.pause : replay.play}
                aria-label={replay.playing ? "To'xtatish" : "Yo'lni qayta ko'rish"}
            >
                {replay.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <input
                type="range"
                min={0}
                max={points.length - 1}
                value={replay.index}
                onChange={(e) => replay.seek(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="Vaqt"
            />
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {dayParts(p.day).name} <b className="text-foreground">{secondsFormat.format(p.t)}</b> · {Math.round(p.speed)} km/h
            </span>
            <select
                value={replay.rate}
                onChange={(e) => replay.setRate(Number(e.target.value))}
                className="h-8 rounded-md border bg-background px-1.5 font-mono text-xs"
                aria-label="Qayta ko'rish tezligi"
            >
                {RATES.map((r) => (
                    <option key={r} value={r}>
                        {r}×
                    </option>
                ))}
            </select>
        </div>
    )
}
