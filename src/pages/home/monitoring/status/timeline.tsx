import ParamDateRange from "@/components/as-params/date-picker-range"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import {
    eachDayOfInterval,
    endOfMonth,
    format,
    startOfMonth,
} from "date-fns"
import { ArrowLeft } from "lucide-react"
import { useMemo, useState } from "react"
import {
    ACTIVE_STATUSES,
    buildMockTimeline,
    IDLE,
    splitByDay,
    STATUS_META,
    type VehicleRow,
} from "./data"

const MAJOR_HOURS = new Set([0, 3, 6, 9, 12, 15, 18, 21, 24])
const ALL_HOURS = Array.from({ length: 25 }, (_, i) => i)
const UZ_WEEKDAYS = ["Yak", "Du", "Se", "Chor", "Pay", "Ju", "Sha"]

export default function VehicleTimeline({
    vehicle,
    onBack,
    onShowRoute,
}: {
    vehicle: VehicleRow
    onBack: () => void
    onShowRoute: (status: number) => void
}) {
    const search = useSearch({ strict: false }) as Record<string, string>
    const today = new Date()
    const monthFrom = startOfMonth(today)
    const monthTo = endOfMonth(today)

    const from = search.from_date ? new Date(search.from_date) : monthFrom
    const to = search.to_date ? new Date(search.to_date) : monthTo

    const days = useMemo(() => {
        if (from > to) return []
        const all = eachDayOfInterval({ start: from, end: to })
        return all.slice(0, 62)
    }, [from.getTime(), to.getTime()])

    const segments = useMemo(
        () => buildMockTimeline(vehicle.id, from, to),
        [vehicle.id, from.getTime(), to.getTime()],
    )

    const totals = useMemo(() => {
        const map: Record<number, number> = {}
        for (const s of segments) {
            const mins = (s.end.getTime() - s.start.getTime()) / 60000
            map[s.status] = (map[s.status] ?? 0) + mins
        }
        const active = Object.values(map).reduce((a, b) => a + b, 0)
        map[IDLE] = Math.max(0, days.length * 1440 - active)
        return map
    }, [segments, days.length])

    const [active, setActive] = useState<number | null>(null)
    const toggle = (k: number) =>
        setActive((prev) => (prev === k ? null : k))

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="shrink-0"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <div className="text-sm font-semibold">
                            {vehicle.truck_number}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {vehicle.driver_name}
                        </div>
                    </div>
                </div>
                <ParamDateRange
                    from="from_date"
                    to="to_date"
                    clearable={false}
                    defaultValue={{ from: monthFrom, to: monthTo }}
                    addButtonProps={{
                        className: "!bg-muted/50 h-8 text-xs min-w-28 justify-start",
                    }}
                />
            </div>

            <Summary totals={totals} active={active} onToggle={toggle} />

            <Card>
                <CardContent className="p-3">
                    <div className="mb-1 flex items-center gap-3 pl-28">
                        <div className="relative h-4 flex-1">
                            {ALL_HOURS.slice(0, 24).map((h) => {
                                const major = MAJOR_HOURS.has(h)
                                return (
                                    <span
                                        key={h}
                                        className={cn(
                                            "absolute -translate-x-1/2 tabular-nums",
                                            major
                                                ? "text-[10px] text-muted-foreground"
                                                : "text-[9px] text-muted-foreground/40",
                                        )}
                                        style={{ left: `${((h + 0.5) / 24) * 100}%` }}
                                    >
                                        {String(h).padStart(2, "0")}
                                    </span>
                                )
                            })}
                        </div>
                    </div>

                    <div className="flex max-h-[calc(100vh-320px)] flex-col overflow-y-auto">
                        {days.length === 0 ? (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                Sana oralig'ini tanlang
                            </div>
                        ) : (
                            days.map((day, i) => (
                                <DayRow
                                    key={day.toISOString()}
                                    day={day}
                                    index={i}
                                    active={active}
                                    onSelect={onShowRoute}
                                    segments={splitByDay(segments, day)}
                                />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function DayRow({
    day,
    index,
    active,
    onSelect,
    segments,
}: {
    day: Date
    index: number
    active: number | null
    onSelect: (status: number) => void
    segments: ReturnType<typeof splitByDay>
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-3 rounded px-2 py-1.5",
                index % 2 === 1 && "bg-muted/40",
            )}
        >
            <div className="w-28 shrink-0 text-xs">
                <span className="font-medium tabular-nums">
                    {format(day, "dd.MM")}
                </span>{" "}
                <span className="text-muted-foreground">
                    {UZ_WEEKDAYS[day.getDay()]}
                </span>
            </div>
            <div className="relative h-6 flex-1 overflow-hidden rounded bg-muted-foreground/10">
                {ALL_HOURS.slice(1, -1).map((h) => (
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
                            onClick={() => onSelect(s.status)}
                            title={`${meta.label}: ${format(s.start, "dd.MM HH:mm")} → ${format(s.end, "dd.MM HH:mm")}`}
                            className={cn(
                                "absolute inset-y-0 cursor-pointer transition-opacity hover:brightness-110",
                                meta.bar,
                                active != null &&
                                    s.status !== active &&
                                    "opacity-0",
                            )}
                            style={{
                                left: `${(s.startMin / 1440) * 100}%`,
                                width: `${((s.endMin - s.startMin) / 1440) * 100}%`,
                            }}
                        />
                    )
                })}
            </div>
        </div>
    )
}

function fmtDur(mins: number): string {
    const total = Math.round(mins)
    const h = Math.floor(total / 60)
    const m = total % 60
    if (h === 0) return `${m}m`
    return m ? `${h}s ${m}m` : `${h}s`
}

function Summary({
    totals,
    active,
    onToggle,
}: {
    totals: Record<number, number>
    active: number | null
    onToggle: (k: number) => void
}) {
    const keys = [...ACTIVE_STATUSES, IDLE]
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {keys.map((k) => {
                const meta = STATUS_META[k]
                const isActive = active === k
                return (
                    <Card
                        key={k}
                        onClick={() => onToggle(k)}
                        className={cn(
                            "cursor-pointer transition-all hover:border-primary/40",
                            active != null && !isActive && "opacity-40",
                            isActive && "border-primary ring-1 ring-primary",
                        )}
                    >
                        <CardContent className="flex flex-col gap-1 px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                                <span
                                    className={cn(
                                        "h-2.5 w-2.5 rounded-sm",
                                        meta.dot,
                                    )}
                                />
                                <span className="truncate text-xs text-muted-foreground">
                                    {meta.label}
                                </span>
                            </div>
                            <span className="text-lg font-semibold tabular-nums">
                                {fmtDur(totals[k] ?? 0)}
                            </span>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
