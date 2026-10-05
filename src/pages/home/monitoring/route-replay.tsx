import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Pause, Play } from "lucide-react"
import { type PointerEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { ACTIVE_STATUSES, IDLE, STATUS_META } from "./status/data"

export type ReplayPoint = { t: number; lat: number; lng: number; speed: number }
export type ReplayStatus = {
    status: number
    start: number
    end: number
    order?: number | null
    from?: string | null
    to?: string | null
}

const RATE = 900
const GAP_MS = 15 * 60 * 1000
const STOP_MIN_MS = 5 * 60 * 1000
const CHART_W = 600
const CHART_H = 96
const PAD_TOP = 8
const BUCKETS = 240

const clockFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
})
const secondsFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
})
const dateClockFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
})

function indexAt(points: ReplayPoint[], t: number) {
    let lo = 0
    let hi = points.length - 1
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1
        if (points[mid].t <= t) lo = mid
        else hi = mid - 1
    }
    return lo
}

function metres(a: ReplayPoint, b: ReplayPoint) {
    const r = Math.PI / 180
    const h =
        Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
        Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2
    return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

function legLength(a: ReplayPoint, b: ReplayPoint) {
    const dt = b.t - a.t
    if (dt <= 0 || dt > GAP_MS) return 0
    const d = metres(a, b)
    return (d / dt) * 3600 < 180 ? d : 0
}

function cumulative(points: ReplayPoint[]) {
    const out = [0]
    for (let i = 1; i < points.length; i++) out.push(out[i - 1] + legLength(points[i - 1], points[i]))
    return out
}

function bearing(a: ReplayPoint, b: ReplayPoint) {
    const r = Math.PI / 180
    const y = Math.sin((b.lng - a.lng) * r) * Math.cos(b.lat * r)
    const x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lng - a.lng) * r)
    return ((Math.atan2(y, x) / r) + 360) % 360
}

function headingAt(points: ReplayPoint[], i: number) {
    for (let k = i; k < points.length - 1; k++) {
        if (points[k].lat !== points[k + 1].lat || points[k].lng !== points[k + 1].lng) return bearing(points[k], points[k + 1])
    }
    for (let k = i; k > 0; k--) {
        if (points[k - 1].lat !== points[k].lat || points[k - 1].lng !== points[k].lng) return bearing(points[k - 1], points[k])
    }
    return 0
}

function locate(points: ReplayPoint[], t: number, travelled: number[]) {
    const i = indexAt(points, t)
    const a = points[i]
    const b = points[i + 1]
    if (!b || b.t <= a.t || b.t - a.t > GAP_MS || t <= a.t) {
        return { t, lat: a.lat, lng: a.lng, speed: a.speed, km: travelled[i] / 1000, course: headingAt(points, i) }
    }
    const k = Math.min(1, (t - a.t) / (b.t - a.t))
    return {
        t,
        course: headingAt(points, i),
        km: (travelled[i] + legLength(a, b) * k) / 1000,
        lat: a.lat + (b.lat - a.lat) * k,
        lng: a.lng + (b.lng - a.lng) * k,
        speed: a.speed + (b.speed - a.speed) * k,
    }
}

function runningStats(points: ReplayPoint[]) {
    const max: number[] = []
    const moving: number[] = []
    let top = 0
    let movingMs = 0
    points.forEach((p, i) => {
        if (i > 0) {
            const a = points[i - 1]
            const dt = p.t - a.t
            if (dt > 0 && dt <= GAP_MS && (a.speed > 3 || p.speed > 3)) movingMs += dt
        }
        top = Math.max(top, p.speed)
        max.push(top)
        moving.push(movingMs)
    })
    const stops: { from: number; to: number }[] = []
    let runStart: number | null = null
    let runLast = 0
    const close = () => {
        if (runStart != null && runLast - runStart >= STOP_MIN_MS) stops.push({ from: runStart, to: runLast })
        runStart = null
    }
    for (const p of points) {
        if (p.speed <= 2) {
            if (runStart == null) runStart = p.t
            runLast = p.t
        } else close()
    }
    close()
    return { max, moving, stops }
}

function durationLabel(ms: number) {
    const minutes = Math.round(ms / 60000)
    const hours = Math.floor(minutes / 60)
    return hours ? `${hours} soat ${minutes % 60} daq` : `${minutes} daq`
}

export function useRouteReplay(points: ReplayPoint[]) {
    const start = points[0]?.t ?? 0
    const end = points[points.length - 1]?.t ?? 0
    const [active, setActive] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [time, setTime] = useState(start)
    const timeRef = useRef(start)
    const pointsRef = useRef(points)
    pointsRef.current = points
    const travelled = useMemo(() => cumulative(points), [points])
    const stats = useMemo(() => runningStats(points), [points])

    useEffect(() => {
        setActive(false)
        setPlaying(false)
        setTime(start)
        timeRef.current = start
    }, [start, end])

    useEffect(() => {
        if (!playing) return
        let frame = 0
        let last = performance.now()
        const tick = (now: number) => {
            const list = pointsRef.current
            let next = Math.min(end, timeRef.current + (now - last) * RATE)
            last = now
            const i = indexAt(list, next)
            const after = list[i + 1]
            if (after && after.t - list[i].t > GAP_MS) next = Math.max(next, after.t)
            timeRef.current = next
            setTime(next)
            if (next >= end) {
                setPlaying(false)
                return
            }
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [playing, end])

    const seek = (t: number) => {
        const clamped = Math.min(end, Math.max(start, t))
        timeRef.current = clamped
        setTime(clamped)
        setActive(true)
    }

    const toggle = () => {
        if (points.length < 2) return
        if (!playing && timeRef.current >= end) seek(start)
        setActive(true)
        setPlaying((p) => !p)
    }

    const stop = () => {
        setPlaying(false)
        setActive(false)
        timeRef.current = start
        setTime(start)
    }

    const position = active && points.length > 0 ? locate(points, time, travelled) : null
    const at = active ? time : end
    const i = points.length ? indexAt(points, at) : 0
    const totals = points.length
        ? {
              km: (position ?? locate(points, end, travelled)).km,
              max: Math.max(stats.max[i] ?? 0, position?.speed ?? 0),
              moving: stats.moving[i] ?? 0,
              stopped: stats.stops
                  .filter((r) => r.from + STOP_MIN_MS <= at)
                  .reduce((sum, r) => sum + Math.max(0, Math.min(r.to, at) - r.from), 0),
          }
        : { km: 0, max: 0, moving: 0, stopped: 0 }

    return { points, start, end, time, playing, active, position, totals, seek, toggle, stop }
}

export type RouteReplay = ReturnType<typeof useRouteReplay>

function buildSeries(points: ReplayPoint[], start: number, end: number) {
    const span = Math.max(1, end - start)
    const buckets: (number | null)[] = Array.from({ length: BUCKETS }, () => null)
    for (const p of points) {
        const b = Math.min(BUCKETS - 1, Math.floor(((p.t - start) / span) * BUCKETS))
        buckets[b] = Math.max(buckets[b] ?? 0, p.speed)
    }
    const max = Math.max(10, ...buckets.map((v) => v ?? 0))
    const top = Math.ceil(max / 10) * 10
    const x = (i: number) => ((i + 0.5) / BUCKETS) * CHART_W
    const y = (v: number) => PAD_TOP + (1 - v / top) * (CHART_H - PAD_TOP)
    const runs: { x: number; y: number }[][] = []
    let run: { x: number; y: number }[] = []
    buckets.forEach((v, i) => {
        if (v == null) {
            if (run.length) runs.push(run)
            run = []
            return
        }
        run.push({ x: x(i), y: y(v) })
    })
    if (run.length) runs.push(run)
    const line = runs.map((r) => r.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("")).join("")
    const area = runs
        .map((r) =>
            r.length > 1
                ? `M${r[0].x.toFixed(1)},${CHART_H}` +
                  r.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("") +
                  `L${r[r.length - 1].x.toFixed(1)},${CHART_H}Z`
                : "",
        )
        .join("")
    return { line, area, top }
}

export function RouteReplayPanel({ replay }: { replay: RouteReplay }) {
    const { points, start, end, time, active, position } = replay
    const svgRef = useRef<SVGSVGElement>(null)
    const [hover, setHover] = useState<number | null>(null)
    const dragging = useRef(false)
    const series = useMemo(() => buildSeries(points, start, end), [points, start, end])

    if (points.length < 2) return null

    const span = Math.max(1, end - start)
    const toX = (t: number) => ((t - start) / span) * 100
    const timeAt = (e: PointerEvent<SVGSVGElement>) => {
        const rect = svgRef.current!.getBoundingClientRect()
        const k = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
        return start + k * span
    }
    const hovered = hover != null ? { t: hover, speed: points[indexAt(points, hover)].speed } : null
    const progress = active ? toX(time) : null

    return (
        <section className="flex flex-col gap-2 rounded-lg border p-3" aria-label="Tezlik grafigi">
            <div className="flex min-w-0 items-baseline justify-between gap-2">
                <span className="shrink-0 whitespace-nowrap text-sm font-semibold">Tezlik grafigi</span>
                {position && (
                    <span className="min-w-0 truncate font-mono text-[11px] tabular-nums text-muted-foreground">
                        {secondsFormat.format(position.t)} · {Math.round(position.speed)} km/h · {position.km.toFixed(1)} km
                    </span>
                )}
            </div>

            <div className="relative">
                <div className="mb-0.5 flex justify-between text-[10px] text-muted-foreground">
                    <span>Tezlik, km/h</span>
                    <span className="font-mono tabular-nums">max {series.top}</span>
                </div>
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                    preserveAspectRatio="none"
                    className="block h-24 w-full cursor-pointer touch-none select-none"
                    onPointerDown={(e) => {
                        dragging.current = true
                        e.currentTarget.setPointerCapture(e.pointerId)
                        replay.seek(timeAt(e))
                    }}
                    onPointerMove={(e) => {
                        const t = timeAt(e)
                        setHover(t)
                        if (dragging.current) replay.seek(t)
                    }}
                    onPointerUp={() => {
                        dragging.current = false
                    }}
                    onPointerLeave={() => {
                        dragging.current = false
                        setHover(null)
                    }}
                >
                    <line x1={0} x2={CHART_W} y1={CHART_H - 0.5} y2={CHART_H - 0.5} className="stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                    <line x1={0} x2={CHART_W} y1={PAD_TOP} y2={PAD_TOP} className="stroke-border" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                    <path d={series.area} className="fill-primary/15" />
                    <path d={series.line} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    {hover != null && (
                        <line
                            x1={(toX(hover) / 100) * CHART_W}
                            x2={(toX(hover) / 100) * CHART_W}
                            y1={0}
                            y2={CHART_H}
                            className="stroke-muted-foreground"
                            strokeWidth={1}
                            strokeDasharray="2 2"
                            vectorEffect="non-scaling-stroke"
                        />
                    )}
                    {progress != null && (
                        <line
                            x1={(progress / 100) * CHART_W}
                            x2={(progress / 100) * CHART_W}
                            y1={0}
                            y2={CHART_H}
                            className="stroke-foreground"
                            strokeWidth={2}
                            vectorEffect="non-scaling-stroke"
                        />
                    )}
                </svg>
                {hovered && (
                    <div
                        className="pointer-events-none absolute top-4 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[11px] shadow-md"
                        style={{ left: `${Math.min(88, Math.max(12, toX(hovered.t)))}%` }}
                    >
                        <span className="font-mono font-semibold tabular-nums text-foreground">{Math.round(hovered.speed)} km/h</span>
                        <span className="ml-1.5 font-mono tabular-nums text-muted-foreground">{clockFormat.format(hovered.t)}</span>
                    </div>
                )}
                <div className="mt-0.5 flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
                    <span>{dateClockFormat.format(start)}</span>
                    <span>{dateClockFormat.format(end)}</span>
                </div>
            </div>
        </section>
    )
}

function spentLabel(ms: number) {
    const minutes = Math.max(0, Math.floor(ms / 60000))
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`
}

function ReplayStatuses({
    replay,
    statuses,
    focusKey,
    onFocus,
}: {
    replay: RouteReplay
    statuses: ReplayStatus[]
    focusKey?: string | null
    onFocus?: (key: string | null) => void
}) {
    const { start, end, time, active } = replay
    const span = Math.max(1, end - start)
    const visible = statuses.filter((s) => s.end > start && s.start < end && STATUS_META[s.status])
    const barRef = useRef<HTMLDivElement>(null)
    const scrubbing = useRef(false)
    const [hoverAt, setHoverAt] = useState<number | null>(null)
    const timeFromEvent = (e: PointerEvent<HTMLDivElement>) => {
        const rect = barRef.current!.getBoundingClientRect()
        const k = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
        return start + k * span
    }
    const current = active ? visible.find((s) => time >= s.start && time < s.end) : undefined
    const pct = (t: number) => Math.min(100, Math.max(0, ((t - start) / span) * 100))
    const upto = active ? time : end
    const overlap = (s: ReplayStatus) => Math.max(0, Math.min(s.end, upto) - Math.max(s.start, start))
    const spent = (status: number) =>
        visible.filter((s) => s.status === status).reduce((sum, s) => sum + overlap(s), 0)
    const busy = visible.reduce((sum, s) => sum + overlap(s), 0)
    const idle = Math.max(0, upto - start - busy)
    return (
        <div className="flex flex-col gap-1.5 border-t px-1 pt-1.5">
            <div
                ref={barRef}
                className="relative h-3 cursor-pointer touch-none select-none"
                onPointerDown={(e) => {
                    scrubbing.current = true
                    e.currentTarget.setPointerCapture(e.pointerId)
                    replay.seek(timeFromEvent(e))
                }}
                onPointerMove={(e) => {
                    const t = timeFromEvent(e)
                    setHoverAt(t)
                    if (scrubbing.current) replay.seek(t)
                }}
                onPointerUp={() => {
                    scrubbing.current = false
                }}
                onPointerLeave={() => {
                    scrubbing.current = false
                    setHoverAt(null)
                }}
            >
            <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full" style={{ background: STATUS_META[IDLE].color }}>
                {visible.map((s, i) => (
                    <span
                        key={i}
                        className="absolute inset-y-0"
                        style={{
                            left: `${pct(s.start)}%`,
                            width: `${Math.max(0.6, pct(s.end) - pct(s.start))}%`,
                            background: STATUS_META[s.status].color,
                        }}
                    />
                ))}
                {active && (
                    <span
                        className="absolute inset-y-0 right-0 bg-background/60"
                        style={{ left: `${pct(time)}%` }}
                    />
                )}
            </div>
            {active && (
                <span
                    className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow-md"
                    style={{ left: `${pct(time)}%` }}
                />
            )}
            {hoverAt != null && (
                <span
                    className="pointer-events-none absolute top-full z-20 mt-1 -translate-x-1/2 whitespace-pre rounded bg-popover px-1.5 py-0.5 font-mono text-[11px] tabular-nums shadow-md ring-1 ring-border"
                    style={{ left: `${Math.min(94, Math.max(6, pct(hoverAt)))}%` }}
                >
                    {fullStamp(hoverAt)}
                </span>
            )}
            </div>
            {visible.length > 0 && (
            <div className="flex flex-wrap justify-between gap-1">
                <button
                    type="button"
                    onClick={() => onFocus?.(focusKey === "idle" ? null : "idle")}
                    className={cn(
                        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition hover:bg-accent hover:text-foreground",
                        focusKey === "idle"
                            ? "bg-primary/15 font-semibold text-foreground ring-1 ring-primary/50"
                            : active && !current
                              ? "bg-foreground/10 font-semibold text-foreground"
                              : "text-muted-foreground",
                        focusKey && focusKey !== "idle" && "opacity-50",
                    )}
                >
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_META[IDLE].color }} />
                    {STATUS_META[IDLE].label}
                    <span className="font-mono tabular-nums">{spentLabel(idle)}</span>
                </button>
                {ACTIVE_STATUSES.map((status) => {
                    const meta = STATUS_META[status]
                    const first = visible.find((s) => s.status === status)
                    const on = current?.status === status
                    const key = String(status)
                    const selected = focusKey === key
                    return (
                        <button
                            key={status}
                            type="button"
                            disabled={!first}
                            onClick={() => onFocus?.(selected ? null : key)}
                            className={cn(
                                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition",
                                selected
                                    ? "bg-primary/15 font-semibold text-foreground ring-1 ring-primary/50"
                                    : on
                                      ? "bg-foreground/10 font-semibold text-foreground"
                                      : first
                                        ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                                        : "text-muted-foreground/40",
                                focusKey && !selected && "opacity-50",
                            )}
                        >
                            <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                            {meta.label}
                            <span className="font-mono tabular-nums">{spentLabel(spent(status))}</span>
                        </button>
                    )
                })}
            </div>
            )}
        </div>
    )
}

const stampParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
})

function fullStamp(t: number) {
    const p = Object.fromEntries(stampParts.formatToParts(t).map((x) => [x.type, x.value]))
    return `${p.hour}:${p.minute}:${p.second}  ${p.day}.${p.month}.${p.year}`
}

function ReplayStat({ label, value }: { label: string; value: string }) {
    return (
        <span className="whitespace-nowrap">
            <span className="text-xs text-muted-foreground">{label}: </span>
            <span className="font-mono font-semibold">{value}</span>
        </span>
    )
}

export function ReplayMapControl({
    replay,
    statuses = [],
    focusKey,
    onFocus,
    leading,
    className,
}: {
    replay: RouteReplay
    statuses?: ReplayStatus[]
    focusKey?: string | null
    onFocus?: (key: string | null) => void
    leading?: ReactNode
    className?: string
}) {
    const { points, start, time, playing, active, position, totals } = replay
    if (points.length < 2) return null
    return (
        <div
            className={cn(
                "flex flex-col gap-1.5 rounded-lg border bg-background/95 p-1.5 shadow-md backdrop-blur",
                className,
            )}
        >
            <div className="flex items-center gap-2">
            {leading}
            <Button
                size="icon"
                variant={playing ? "secondary" : "default"}
                className="h-8 w-8 shrink-0"
                onClick={replay.toggle}
                aria-label={playing ? "To'xtatib turish" : "Qayta ijro"}
            >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="min-w-0 flex-1 leading-tight">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm tabular-nums">
                    <span className="whitespace-pre font-mono font-semibold">{fullStamp(active ? time : start)}</span>
                    <span className="ml-auto flex flex-wrap items-baseline justify-end gap-x-3 gap-y-0.5 pr-2">
                        {position && <ReplayStat label="Tezlik" value={`${Math.round(position.speed)} km/h`} />}
                        <ReplayStat label="Masofa" value={`${totals.km.toFixed(1)} km`} />
                        <ReplayStat label="Max tezlik" value={`${Math.round(totals.max)} km/h`} />
                        <ReplayStat label="Harakatda" value={durationLabel(totals.moving)} />
                        <ReplayStat label="To'xtashlar" value={durationLabel(totals.stopped)} />
                    </span>
                </div>
            </div>
            </div>
            <ReplayStatuses replay={replay} statuses={statuses} focusKey={focusKey} onFocus={onFocus} />
        </div>
    )
}
