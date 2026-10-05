import type { ReactNode } from "react"
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
import { LinkDeviceModal, LinkGpsIconButton } from "./link-device-modal"

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
    extra,
}: {
    value: TruckStatusFilter
    onChange: (next: TruckStatusFilter) => void
    counts: Record<TruckStatusFilter, number>
    className?: string
    extra?: ReactNode
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
                                "rounded px-1.5 font-mono text-xs font-semibold tabular-nums",
                                active ? "bg-primary-foreground/20" : "bg-muted",
                            )}
                        >
                            {counts[key]}
                        </span>
                    </button>
                )
            })}
            {extra && (
                <>
                    <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-border" />
                    {extra}
                </>
            )}
        </div>
    )
}

export type ConnectionFilter = "all" | "online" | "offline"

const CONNECTION_FILTERS: ConnectionFilter[] = ["offline"]

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

export function NoGpsFilterButton({
    active,
    count,
    onToggle,
}: {
    active: boolean
    count: number
    onToggle: () => void
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onToggle}
            className={cn(
                "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition",
                active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
        >
            <span aria-hidden className="h-2 w-2 rounded-full border border-dashed border-current" />
            <span>GPS yo'q</span>
            <span
                className={cn(
                    "rounded px-1.5 font-mono text-xs font-semibold tabular-nums",
                    active ? "bg-primary-foreground/20" : "bg-muted",
                )}
            >
                {count}
            </span>
        </button>
    )
}

export function ConnectionFilterBar({
    value,
    onChange,
    counts,
    className,
    bare = false,
}: {
    value: ConnectionFilter
    onChange: (next: ConnectionFilter) => void
    counts: Record<ConnectionFilter, number>
    className?: string
    bare?: boolean
}) {
    const { t } = useTranslation()
    return (
        <div
            role="tablist"
            aria-label={t("status.online")}
            className={cn(
                bare
                    ? "flex items-center gap-0.5"
                    : "flex items-center gap-0.5 rounded-lg border bg-background/90 p-0.5 shadow-md backdrop-blur",
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
                        onClick={() => onChange(active ? "all" : key)}
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
                                "rounded px-1.5 font-mono text-xs font-semibold tabular-nums",
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
    unlinked?: UnlinkedVehicle[]
}

export type UnlinkedVehicle = { id: number; truck_number: string; driver_name: string | null }

export function UnlinkedVehicles({ items }: { items: UnlinkedVehicle[] }) {
    if (items.length === 0) return null
    return (
        <div className="mt-3 flex flex-col gap-1.5">
            <LinkDeviceModal />
            <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                GPS yo'q
                <span className="rounded bg-muted px-1.5 font-mono text-[11px] tabular-nums">{items.length}</span>
            </div>
            <ul className="flex flex-col gap-1">
                {items.map((v) => (
                    <li
                        key={v.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border/70 py-1 pl-3 pr-1"
                    >
                        <span className="flex min-w-0 items-center gap-2 opacity-70">
                            <span className="shrink-0 font-mono text-sm font-bold tracking-wide">{v.truck_number}</span>
                            {v.driver_name && (
                                <span className="min-w-0 truncate text-xs text-muted-foreground">{v.driver_name}</span>
                            )}
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground">
                            GPS yo'q
                            <LinkGpsIconButton vehicle={v} />
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default function GpsList({ items, orders, loading, unavailable, activeImei, onSelect, unlinked = [] }: Props) {
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
                        className="relative min-w-0 opacity-0 animate-[slide-in_320ms_cubic-bezier(.2,.7,.2,1)_forwards]"
                    >
                        <button
                            type="button"
                            onClick={() => onSelect?.(item)}
                            className={cn(
                                "relative grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-0.5 overflow-hidden rounded-md border bg-card py-1.5 pl-3 pr-2 text-left transition",
                                "hover:border-primary/40 hover:bg-accent/40",
                                active ? "border-primary/60 ring-1 ring-primary/20" : "border-border/70",
                            )}
                        >
                            <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: color }} />

                            <span className={cn("flex min-w-0 items-center gap-2", item.vehicle && hasControl && "pr-6")}>
                                <span className="shrink-0 font-mono text-sm font-bold leading-5 tracking-wide">
                                    {item.vehicle_number || item.tracker_name || item.imei}
                                </span>
                                <span className="ml-auto min-w-0 truncate text-right text-[11px] text-muted-foreground tabular-nums">
                                    {order ? (
                                        <>
                                            <span className="font-medium text-foreground">
                                                {order.from && order.to ? `${order.from} → ${order.to}` : "Yo'nalish noma'lum"}
                                            </span>
                                            <span className="font-mono"> · #{order.external_id}</span>
                                            {" · "}
                                            yuklangan <b className="font-medium text-foreground">{clock(order.loaded_at)}</b>
                                            {", "}
                                            <b className="font-medium text-foreground">{minutes(order.spent_minutes)}</b>
                                        </>
                                    ) : (
                                        "Buyurtma yo'q"
                                    )}
                                </span>
                                {meta && (
                                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold" style={{ color: meta.color }}>
                                        <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                                        {meta.label}
                                    </span>
                                )}
                            </span>

                            <span className="flex min-w-0 items-center gap-2 text-[11px] leading-4 text-muted-foreground tabular-nums">
                                <span className="min-w-0 truncate text-xs">{item.driver_name || "—"}</span>
                                <span className={cn("ml-auto inline-flex shrink-0 items-center gap-1", stale && "text-destructive")}>
                                    <Clock className="h-3 w-3 shrink-0" />
                                    {item.last_update ? format(parseISO(item.last_update), "dd/MM HH:mm") : "—"}
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
                                        className="absolute right-1 top-1 z-10 h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <Unlink className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">{t("actions.unlink_gps")}</TooltipContent>
                            </Tooltip>
                        ) : null}
                    </li>
                )
            })}
        </ul>
        <UnlinkedVehicles items={unlinked} />
        </TooltipProvider>
        </>
    )
}
