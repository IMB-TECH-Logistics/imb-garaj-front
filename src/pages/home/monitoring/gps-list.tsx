import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    MONITORING_GPS_DEVICES,
    MONITORING_GPS_LINK,
    MONITORING_GPS_LIVE,
    VEHICLES,
} from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
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
import type { GpsLiveVehicle, TruckStatusFilter, VehicleOrderBadge } from "./types"
import { TRUCK_STATUS_FILTERS } from "./types"

const TRUCK_STATUS_LABELS: Record<TruckStatusFilter, string> = {
    all: "page.truck_status_all",
    loaded: "page.truck_status_loaded",
    empty: "page.truck_status_empty",
    repair: "page.truck_status_repair",
}

const TRUCK_STATUS_DOTS: Record<TruckStatusFilter, string | null> = {
    all: null,
    loaded: "bg-emerald-500",
    empty: "bg-sky-500",
    repair: "bg-orange-500",
}

export function TruckStatusFilterBar({
    value,
    onChange,
    counts,
    className,
}: {
    value: TruckStatusFilter
    onChange: (next: TruckStatusFilter) => void
    counts: Record<TruckStatusFilter, number>
    className?: string
}) {
    const { t } = useTranslation()
    return (
        <div
            role="tablist"
            aria-label={t("page.truck_status_all")}
            className={cn(
                "flex items-center gap-0.5 rounded-lg border bg-background/90 p-0.5 shadow-md backdrop-blur",
                className,
            )}
        >
            {TRUCK_STATUS_FILTERS.map((key) => {
                const active = value === key
                const dot = TRUCK_STATUS_DOTS[key]
                return (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(key)}
                        className={cn(
                            "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition",
                            active
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                    >
                        {dot && <span aria-hidden className={cn("h-2 w-2 rounded-full", dot)} />}
                        <span>{t(TRUCK_STATUS_LABELS[key])}</span>
                        <span
                            className={cn(
                                "rounded px-1 font-mono text-[10px] tabular-nums",
                                active ? "bg-primary-foreground/20" : "bg-muted",
                            )}
                        >
                            {counts[key]}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

export type ConnectionFilter = "all" | "online" | "offline"

const CONNECTION_FILTERS: ConnectionFilter[] = ["all", "online", "offline"]

const CONNECTION_LABELS: Record<ConnectionFilter, string> = {
    all: "page.truck_status_all",
    online: "status.online",
    offline: "status.offline",
}

const CONNECTION_DOTS: Record<ConnectionFilter, string | null> = {
    all: null,
    online: "bg-emerald-500",
    offline: "bg-muted-foreground/60",
}

export function ConnectionFilterBar({
    value,
    onChange,
    counts,
    className,
}: {
    value: ConnectionFilter
    onChange: (next: ConnectionFilter) => void
    counts: Record<ConnectionFilter, number>
    className?: string
}) {
    const { t } = useTranslation()
    return (
        <div
            role="tablist"
            aria-label={t("status.online")}
            className={cn(
                "flex items-center gap-0.5 rounded-lg border bg-background/90 p-0.5 shadow-md backdrop-blur",
                className,
            )}
        >
            {CONNECTION_FILTERS.map((key) => {
                const active = value === key
                const dot = CONNECTION_DOTS[key]
                return (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(key)}
                        className={cn(
                            "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition",
                            active
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                    >
                        {dot && <span aria-hidden className={cn("h-2 w-2 rounded-full", dot)} />}
                        <span>{t(CONNECTION_LABELS[key])}</span>
                        <span
                            className={cn(
                                "rounded px-1 font-mono text-[10px] tabular-nums",
                                active ? "bg-primary-foreground/20" : "bg-muted",
                            )}
                        >
                            {counts[key]}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

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
    const hasControl = useHasAction("monitoring_control")

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
        <TooltipProvider delayDuration={150}>
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
                        className="relative opacity-0 animate-[slide-in_320ms_cubic-bezier(.2,.7,.2,1)_forwards]"
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

                            <span className={cn("flex items-center justify-between gap-2", item.vehicle && hasControl && "pr-7")}>
                                <span className="flex min-w-0 items-baseline gap-2">
                                    <span className="shrink-0 font-mono text-lg font-bold leading-tight tracking-wider">
                                        {item.vehicle_number || item.tracker_name || item.imei}
                                    </span>
                                    {item.driver_name && (
                                        <span className="truncate text-sm font-medium text-muted-foreground">
                                            {item.driver_name}
                                        </span>
                                    )}
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
                        {item.vehicle && hasControl ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        disabled={isPending}
                                        aria-label={t("actions.unlink_gps")}
                                        onClick={() => unlink(item)}
                                        className="absolute right-1.5 top-1.5 z-10 h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <Unlink className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">{t("actions.unlink_gps")}</TooltipContent>
                            </Tooltip>
                        ) : null}
                    </li>
                )
            })}
        </ul>
        </TooltipProvider>
        </>
    )
}
