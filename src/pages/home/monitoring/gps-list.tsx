import { Button } from "@/components/ui/button"
import {
    MONITORING_GPS_DEVICES,
    MONITORING_GPS_LINK,
    MONITORING_GPS_LIVE,
    VEHICLES,
} from "@/constants/api-endpoints"
import { useConfirm } from "@/hooks/useConfirm"
import { usePost } from "@/hooks/usePost"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { format, isToday, parseISO } from "date-fns"
import { Clock, Unlink } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { DimensionEmpty, DimensionListSkeleton } from "./dimension-row"
import { clock, minutes, orderStatusMeta } from "./order-card"
import type { GpsLiveVehicle, VehicleOrderBadge } from "./types"

type Props = {
    items: GpsLiveVehicle[]
    orders?: Record<number, VehicleOrderBadge>
    loading?: boolean
    unavailable?: boolean
    activeImei?: string | null
    onSelect?: (item: GpsLiveVehicle) => void
}

export default function GpsList({ items, orders, loading, unavailable, activeImei, onSelect }: Props) {
    const { t } = useTranslation()
    const confirm = useConfirm()
    const queryClient = useQueryClient()
    const { mutate, isPending } = usePost()

    const unlink = async (item: GpsLiveVehicle) => {
        const ok = await confirm({
            title: t("messages.confirm_unlink_device", {
                vehicle: item.vehicle_number,
            }),
        })
        if (!ok) return
        mutate(
            MONITORING_GPS_LINK,
            { vehicle: item.vehicle, imei: "" },
            {
                onSuccess: () => {
                    toast.success(t("toast.device_unlinked"))
                    queryClient.invalidateQueries({ queryKey: [VEHICLES] })
                    queryClient.invalidateQueries({
                        queryKey: [MONITORING_GPS_DEVICES],
                    })
                    queryClient.invalidateQueries({
                        queryKey: [MONITORING_GPS_LIVE],
                    })
                },
            },
        )
    }

    if (loading && items.length === 0) {
        return <DimensionListSkeleton />
    }
    if (unavailable && items.length === 0) {
        return (
            <DimensionEmpty
                title="GPS xizmati vaqtincha ishlamayapti"
                hint="Ma'lumotlar xizmat tiklanganda avtomatik yangilanadi"
            />
        )
    }
    if (!loading && items.length === 0) {
        return (
            <DimensionEmpty
                title="GPS qurilma yo'q"
                hint="Qurilmani «GPS biriktirish» orqali qo'shing"
            />
        )
    }

    return (
        <>
        {unavailable && (
            <p className="mb-2 rounded-md border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-xs text-orange-600 dark:text-orange-400">
                GPS xizmati vaqtincha ishlamayapti — oxirgi ma'lum joylashuvlar ko'rsatilmoqda
            </p>
        )}
        <ul className="flex flex-col gap-1.5">
            {items.map((item, i) => {
                const order = item.vehicle != null ? orders?.[item.vehicle] : undefined
                const meta = order ? orderStatusMeta(order.garage_status) : null
                const color = meta?.color ?? "hsl(var(--muted-foreground) / 0.4)"
                const active = item.imei === activeImei
                const stale = item.last_update && !isToday(parseISO(item.last_update))
                return (
                    <li
                        key={item.imei}
                        style={{ animationDelay: `${i * 35}ms` }}
                        className="flex items-stretch gap-1 opacity-0 animate-[slide-in_320ms_cubic-bezier(.2,.7,.2,1)_forwards]"
                    >
                        <button
                            type="button"
                            onClick={() => onSelect?.(item)}
                            className={cn(
                                "relative grid w-full min-w-0 gap-1 overflow-hidden rounded-lg border bg-card py-2.5 pl-4 pr-3 text-left transition",
                                "hover:border-primary/40 hover:bg-accent/40",
                                active ? "border-primary/60 ring-1 ring-primary/20" : "border-border/70",
                            )}
                        >
                            <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: color }} />

                            <span className="flex items-center justify-between gap-2">
                                <span className="truncate font-mono text-lg font-bold leading-tight tracking-wider">
                                    {item.vehicle_number || item.tracker_name || item.imei}
                                </span>
                                {meta && (
                                    <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold" style={{ color: meta.color }}>
                                        <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                                        {meta.label}
                                    </span>
                                )}
                            </span>

                            <span className="flex items-center justify-between gap-2">
                                <span className={cn("truncate text-sm font-medium", !order && "text-muted-foreground")}>
                                    {order
                                        ? order.from && order.to
                                            ? `${order.from} → ${order.to}`
                                            : "Yo'nalish noma'lum"
                                        : "Buyurtma yo'q"}
                                </span>
                                {order && (
                                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">#{order.external_id}</span>
                                )}
                            </span>

                            <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground tabular-nums">
                                {order && (
                                    <>
                                        <span>
                                            Yuklangan{" "}
                                            <b className="font-medium text-foreground">{clock(order.loaded_at)}</b>
                                        </span>
                                        <b className="font-medium text-foreground">{minutes(order.spent_minutes)}</b>
                                    </>
                                )}
                                <span className={cn("ml-auto inline-flex items-center gap-1", stale && "text-destructive")}>
                                    <Clock className="h-3 w-3 shrink-0" />
                                    {item.last_update ? format(parseISO(item.last_update), "dd.MM HH:mm") : "—"}
                                </span>
                            </span>
                        </button>
                        {item.vehicle ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={isPending}
                                aria-label={t("actions.delete")}
                                title={t("actions.delete")}
                                onClick={() => unlink(item)}
                                className="h-auto w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                                <Unlink className="h-4 w-4" />
                            </Button>
                        ) : null}
                    </li>
                )
            })}
        </ul>
        </>
    )
}
