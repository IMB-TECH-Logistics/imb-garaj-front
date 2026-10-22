import { useEffect, useMemo, useRef, useState } from "react"
import type { ColoredSegment, MapPoint } from "./route-map"

const DRAW_MS = 2500
const FRAME_MS = 40

function timeSpan(segments: ColoredSegment[]) {
    let from = Infinity
    let to = -Infinity
    for (const s of segments) {
        if (!s.times?.length) continue
        from = Math.min(from, s.times[0])
        to = Math.max(to, s.times[s.times.length - 1])
    }
    return to > from ? { from, to } : null
}

function cut(segment: ColoredSegment, cutoff: number): ColoredSegment | null {
    const times = segment.times
    if (!times?.length) return segment
    if (times[0] > cutoff) return null
    const next = times.findIndex((t) => t > cutoff)
    if (next === -1) return segment
    const a = segment.points[next - 1]
    const b = segment.points[next]
    const k = (cutoff - times[next - 1]) / Math.max(1, times[next] - times[next - 1])
    const head: MapPoint = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
    return {
        ...segment,
        points: [...segment.points.slice(0, next), head],
        speeds: segment.speeds ? [...segment.speeds.slice(0, next), segment.speeds[next - 1]] : undefined,
        times: [...times.slice(0, next), cutoff],
    }
}

export function useRouteDraw(segments: ColoredSegment[], key: string, ready: boolean, disabled: boolean) {
    const [cutoff, setCutoff] = useState<number | null>(null)
    const drawn = useRef<string | null>(null)
    const latest = useRef(segments)
    latest.current = segments

    useEffect(() => {
        if (!ready || drawn.current === key) return
        drawn.current = key
        const span = timeSpan(latest.current)
        if (!span) return
        const started = performance.now()
        let painted = 0
        let frame = 0
        const tick = (now: number) => {
            const progress = Math.min(1, (now - started) / DRAW_MS)
            if (progress >= 1) {
                setCutoff(null)
                return
            }
            if (now - painted >= FRAME_MS) {
                painted = now
                const eased = 1 - (1 - progress) ** 3
                setCutoff(span.from + (span.to - span.from) * eased)
            }
            frame = requestAnimationFrame(tick)
        }
        setCutoff(span.from)
        frame = requestAnimationFrame(tick)
        return () => {
            cancelAnimationFrame(frame)
            setCutoff(null)
        }
    }, [key, ready])

    return useMemo(() => {
        if (cutoff == null || disabled) return segments
        return segments.map((s) => cut(s, cutoff)).filter((s): s is ColoredSegment => s !== null && s.points.length > 1)
    }, [segments, cutoff, disabled])
}
