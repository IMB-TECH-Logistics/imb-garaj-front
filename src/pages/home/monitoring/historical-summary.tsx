import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"
import { RoutePolyline } from "./types"


// "YYYY-MM-DD" → local Date (avoids the UTC shift of `new Date(str)`).
export function parseLocalDate(raw: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
    if (!m) return null
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

export function HistoricalSummary({
    data,
    loading,
    onOpenTrip,
}: {
    data: RoutePolyline | undefined
    loading?: boolean
    onOpenTrip?: (tripId: number) => void
}) {
    const { t } = useTranslation()
    if (loading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-12 animate-pulse rounded-md bg-muted/40"
                    />
                ))}
            </div>
        )
    }
    if (!data) {
        return (
            <div className="py-10 text-center text-sm text-muted-foreground">
                {t("page.not_found")}
            </div>
        )
    }
    if (data.count === 0) {
        return (
            <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                    {t("page.no_gps")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                    {data.latest_at
                        ? `${formatStamp(data.latest_at)}`
                        : t("page.no_data_period")}
                </p>
            </div>
        )
    }

    const km = (data.distance_m / 1000).toFixed(2)
    const durMin = durationMinutes(data.first_at, data.last_at)

    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
                <Stat label={t("form.distance")} value={km} unit={t("mon.units.km")} />
                <Stat
                    label={t("table.duration")}
                    value={durMin != null ? String(durMin) : "—"}
                    unit={durMin != null ? t("mon.units.min") : undefined}
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Row label={t("table.start_time")} value={formatStamp(data.first_at)} />
                <Row label={t("table.end_time")} value={formatStamp(data.last_at)} />
            </div>

            {data.trip != null && onOpenTrip && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenTrip(data.trip!)}
                    className="mt-1 w-full justify-between"
                >
                    <span>{t("page.trip_list")} · #{data.trip}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    )
}

function Stat({
    label,
    value,
    unit,
    big,
}: {
    label: string
    value: string
    unit?: string
    big?: boolean
}) {
    return (
        <div className="rounded-md border bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-0.5 flex items-baseline gap-1">
                <span
                    className={cn(
                        "font-semibold tabular-nums",
                        big ? "text-2xl" : "text-base",
                    )}
                >
                    {value}
                </span>
                {unit && (
                    <span className="text-xs text-muted-foreground">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    )
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-muted/20 px-3 py-1.5">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="truncate text-sm font-medium tabular-nums">
                {value}
            </div>
        </div>
    )
}

export function StatStrip({ data }: { data: RoutePolyline }) {
    const { t } = useTranslation()
    return (
        <div className="flex flex-wrap gap-2">
            {data.trip != null && (
                <Pill label={t("page.trips")} value={`#${data.trip}`} />
            )}
            {data.order != null && (
                <Pill label={t("mon.order")} value={`#${data.order}`} />
            )}
        </div>
    )
}

function Pill({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold tabular-nums">{value}</span>
        </div>
    )
}

function formatStamp(raw: string | null): string {
    if (!raw) return "—"
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return raw
    return format(d, "dd/MM HH:mm")
}

function durationMinutes(from: string | null, to: string | null): number | null {
    if (!from || !to) return null
    const a = new Date(from).getTime()
    const b = new Date(to).getTime()
    if (Number.isNaN(a) || Number.isNaN(b)) return null
    return Math.max(0, Math.round((b - a) / 60000))
}
