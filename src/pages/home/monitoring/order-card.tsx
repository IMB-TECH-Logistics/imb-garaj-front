import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Spinner from "@/components/ui/spinner"
import { MONITORING_VEHICLE_LAST_ORDER } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { Route } from "lucide-react"
import { useMemo } from "react"
import type { ColoredSegment, MapPoint } from "./route-map"
import { ORDER_STATUS, STATUS_META } from "./status/data"
import type { VehicleLastOrder } from "./types"

const EXTRA_META: Record<number, { label: string; color: string }> = {
    [ORDER_STATUS.COMPLETED]: { label: "Tugallandi", color: "#94a3b8" },
    [ORDER_STATUS.CANCELED]: { label: "Bekor qilindi", color: "#f87171" },
}

export function orderStatusMeta(garageStatus: number | null | undefined) {
    if (garageStatus == null) return { label: "—", color: "#9ca3af" }
    return STATUS_META[garageStatus] ?? EXTRA_META[garageStatus] ?? { label: "—", color: "#9ca3af" }
}

export function clock(value: string | null) {
    return value ? format(parseISO(value), "dd.MM HH:mm") : "—"
}

export function minutes(value: number | null | undefined) {
    if (value == null) return "—"
    const total = Math.round(value)
    const hours = Math.floor(total / 60)
    return hours ? `${hours} soat ${total % 60} daq` : `${total} daq`
}

export function useVehicleLastOrder(vehicleId: number | null) {
    const query = useGet<VehicleLastOrder>(`${MONITORING_VEHICLE_LAST_ORDER}/${vehicleId}/last-order`, {
        enabled: vehicleId != null,
        options: { staleTime: 60 * 1000, refetchInterval: 60 * 1000 },
    })

    const map = useMemo(() => {
        const track = query.data?.track
        if (!track || track.segments.length === 0) return null
        const segments: ColoredSegment[] = track.segments.map((s) => ({
            points: s.points as MapPoint[],
            color: orderStatusMeta(s.garage_status).color,
        }))
        const first = track.segments[0].points[0] as MapPoint
        const lastSegment = track.segments[track.segments.length - 1]
        const last = lastSegment.points[lastSegment.points.length - 1] as MapPoint
        return { segments, bbox: track.bbox, points: [first, last] as MapPoint[] }
    }, [query.data])

    return { data: query.data, loading: query.isLoading, map }
}

type CardProps = {
    lastOrder: ReturnType<typeof useVehicleLastOrder>
    showRoute: boolean
    onToggleRoute: () => void
}

export function LastOrderCard({ lastOrder, showRoute, onToggleRoute }: CardProps) {
    const { data, loading, map } = lastOrder

    if (loading) {
        return (
            <section className="flex flex-col gap-3 rounded-lg border p-3" aria-busy="true" aria-label="Oxirgi buyurtma">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Spinner size="sm" />
                    Buyurtma va GPS ma'lumotlari yuklanmoqda…
                </div>
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 rounded-md" />
                    ))}
                </div>
                <Skeleton className="h-8 rounded-md" />
            </section>
        )
    }
    if (!data) return null
    if (!data.available) {
        return (
            <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                Logistika bilan aloqa sozlanmagan, buyurtmani ko'rsatib bo'lmaydi.
            </div>
        )
    }
    if (!data.order) {
        return <div className="rounded-lg border p-3 text-xs text-muted-foreground">Bu mashinada Logistika buyurtmasi yo'q.</div>
    }

    const { order, stats } = data
    const meta = orderStatusMeta(order.garage_status)

    return (
        <section className="flex flex-col gap-3 rounded-lg border p-3" aria-label="Oxirgi buyurtma">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Oxirgi buyurtma</span>
                <span className="text-[11px] font-semibold" style={{ color: meta.color }}>
                    {meta.label}
                </span>
            </div>

            <div className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">
                    {order.from && order.to ? `${order.from} → ${order.to}` : "Yo'nalish noma'lum"}
                </span>
                <span className="font-mono text-xs text-muted-foreground">#{order.external_id}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {[
                    ["Sarflangan vaqt", minutes(stats?.spent_minutes)],
                    ["Masofa", stats?.distance_km != null ? `${stats.distance_km.toFixed(1)} km` : "—"],
                    ["Harakatda", minutes(stats?.moving_minutes)],
                    ["To'xtab turgan", minutes(stats?.stop_minutes)],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-md border px-2.5 py-1.5">
                        <div className="text-[11px] text-muted-foreground">{label}</div>
                        <div className="font-mono text-sm font-bold tabular-nums">{value}</div>
                    </div>
                ))}
            </div>

            {data.stale && (
                <p className="text-[11px] text-muted-foreground">Logistika hozir javob bermayapti, oxirgi ma'lum holat ko'rsatilmoqda.</p>
            )}

            <Button
                variant={showRoute ? "default" : "outline"}
                size="sm"
                className={cn("h-8 gap-2 text-xs")}
                disabled={!map}
                onClick={onToggleRoute}
            >
                <Route className="h-3.5 w-3.5" />
                {showRoute ? "Kunlik marshrutga qaytish" : map ? "Buyurtma marshruti" : "Buyurtma bo'yicha GPS nuqtalari yo'q"}
            </Button>
        </section>
    )
}
