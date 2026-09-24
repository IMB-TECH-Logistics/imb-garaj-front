import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MONITORING_STATUS_TIMELINE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { RotateCcw } from "lucide-react"
import { useMemo } from "react"
import {
    ACTIVE_STATUSES,
    type ApiStatusSegment,
    IDLE,
    type Segment,
    splitByDay,
    STATUS_META,
} from "./status/data"

const MAJOR_HOURS = new Set([0, 3, 6, 9, 12, 15, 18, 21, 24])
const HOURS = Array.from({ length: 25 }, (_, i) => i)

function fmtDur(mins: number): string {
    const total = Math.round(mins)
    const h = Math.floor(total / 60)
    const m = total % 60
    if (h === 0) return `${m}m`
    return m ? `${h}s ${m}m` : `${h}s`
}

export default function StatusRibbon({
    vehicleId,
    vehicleLabel,
    date,
    active = null,
    onToggle,
}: {
    vehicleId: number
    vehicleLabel?: string | null
    date: Date
    active?: number | null
    onToggle?: (status: number) => void
}) {
    const dayParam = format(date, "yyyy-MM-dd")

    const { data: apiSegments = [], isLoading } = useGet<ApiStatusSegment[]>(
        MONITORING_STATUS_TIMELINE,
        {
            params: {
                vehicle: vehicleId,
                from_date: dayParam,
                to_date: dayParam,
            },
        },
    )

    const segments = useMemo(() => {
        const mapped: Segment[] = apiSegments.map((s) => ({
            status: s.status,
            start: new Date(s.start),
            end: new Date(s.end),
        }))
        return splitByDay(mapped, date)
    }, [apiSegments, date.getTime()])

    const totals = useMemo(() => {
        const map: Record<number, number> = {}
        for (const s of segments) {
            map[s.status] = (map[s.status] ?? 0) + (s.endMin - s.startMin)
        }
        const sum = Object.values(map).reduce((a, b) => a + b, 0)
        map[IDLE] = Math.max(0, 1440 - sum)
        return map
    }, [segments])

    const toggle = (k: number) => onToggle?.(k)

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                <CardTitle className="text-sm font-semibold">
                    Holat lentasi
                    <span className="ml-2 font-normal text-muted-foreground">
                        {vehicleLabel || `#${vehicleId}`} ·{" "}
                        {format(date, "dd.MM.yyyy")}
                    </span>
                </CardTitle>
                {active != null && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggle(active)}
                        className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Hammasi
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {/* Hour axis */}
                <div className="relative h-4">
                    {HOURS.slice(0, 24).map((h) => (
                        <span
                            key={h}
                            className={cn(
                                "absolute -translate-x-1/2 tabular-nums",
                                MAJOR_HOURS.has(h)
                                    ? "text-[10px] text-muted-foreground"
                                    : "text-[9px] text-muted-foreground/40",
                            )}
                            style={{ left: `${((h + 0.5) / 24) * 100}%` }}
                        >
                            {String(h).padStart(2, "0")}
                        </span>
                    ))}
                </div>

                {/* The ribbon */}
                <div className="relative h-9 overflow-hidden rounded-md bg-muted-foreground/10">
                    {HOURS.slice(1, -1).map((h) => (
                        <span
                            key={h}
                            className={cn(
                                "absolute inset-y-0",
                                MAJOR_HOURS.has(h)
                                    ? "w-px bg-background/60"
                                    : "border-l border-dashed border-background/40",
                            )}
                            style={{ left: `${(h / 24) * 100}%` }}
                        />
                    ))}
                    {segments.map((s, i) => {
                        const meta = STATUS_META[s.status]
                        if (!meta) return null
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => toggle(s.status)}
                                title={`${meta.label}: ${format(s.start, "HH:mm")} → ${format(s.end, "HH:mm")}`}
                                className={cn(
                                    "absolute inset-y-0 cursor-pointer transition-opacity hover:brightness-110",
                                    meta.bar,
                                    active != null &&
                                        s.status !== active &&
                                        "opacity-45",
                                )}
                                style={{
                                    left: `${(s.startMin / 1440) * 100}%`,
                                    width: `${((s.endMin - s.startMin) / 1440) * 100}%`,
                                }}
                            />
                        )
                    })}
                    {!isLoading && segments.length === 0 && (
                        <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
                            Bu kun uchun holat ma'lumoti yo'q
                        </div>
                    )}
                </div>

                {/* Legend + per-status totals (click to isolate a status) */}
                <div className="flex flex-wrap gap-1.5">
                    {[...ACTIVE_STATUSES, IDLE].map((k) => {
                        const meta = STATUS_META[k]
                        const isActive = active === k
                        return (
                            <button
                                key={k}
                                type="button"
                                onClick={() => toggle(k)}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition",
                                    isActive
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:bg-muted",
                                    active != null && !isActive && "opacity-50",
                                )}
                            >
                                <span
                                    className={cn(
                                        "h-2.5 w-2.5 rounded-sm",
                                        meta.dot,
                                    )}
                                />
                                <span className="text-muted-foreground">
                                    {meta.label}
                                </span>
                                <span className="font-semibold tabular-nums">
                                    {fmtDur(totals[k] ?? 0)}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
