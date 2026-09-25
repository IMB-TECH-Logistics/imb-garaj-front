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
import {
    DimensionEmpty,
    DimensionListSkeleton,
    DimensionRow,
} from "./dimension-row"
import { OrderStatusChip } from "./order-card"
import type { GpsLiveVehicle, VehicleOrderBadge } from "./types"

type Props = {
    items: GpsLiveVehicle[]
    orders?: Record<number, VehicleOrderBadge>
    loading?: boolean
    activeImei?: string | null
    onSelect?: (item: GpsLiveVehicle) => void
}

function secondsSince(value: string | null) {
    return value
        ? Math.max(0, Math.round((Date.now() - Date.parse(value)) / 1000))
        : null
}

export default function GpsList({ items, orders, loading, activeImei, onSelect }: Props) {
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
    if (!loading && items.length === 0) {
        return (
            <DimensionEmpty
                title="GPS qurilma yo'q"
                hint="Qurilmani «GPS biriktirish» orqali qo'shing"
            />
        )
    }

    return (
        <ul className="flex flex-col gap-1.5">
            {items.map((item, i) => (
                <DimensionRow
                    key={item.imei}
                    index={i}
                    active={item.imei === activeImei}
                    onClick={() => onSelect?.(item)}
                    action={
                        item.vehicle ? (
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
                        ) : undefined
                    }
                    secondsSince={secondsSince(item.last_update)}
                    primary={
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                                {i + 1}.
                            </span>
                            <span className="font-mono tracking-wide">
                                {item.vehicle_number || item.tracker_name || item.imei}
                            </span>
                        </span>
                    }
                    secondary={
                        item.speed != null
                            ? `${Math.round(item.speed)} km/h`
                            : undefined
                    }
                    footer={
                        item.vehicle != null && orders?.[item.vehicle] ? (
                            <OrderStatusChip
                                code={orders[item.vehicle].external_id}
                                garageStatus={orders[item.vehicle].garage_status}
                            />
                        ) : undefined
                    }
                    metaRight={
                        <span
                            className={cn(
                                "inline-flex items-center gap-1",
                                item.last_update &&
                                    !isToday(parseISO(item.last_update)) &&
                                    "text-destructive",
                            )}
                        >
                            <Clock className="h-3 w-3 shrink-0" />
                            {item.last_update
                                ? format(parseISO(item.last_update), "dd.MM.yyyy HH:mm")
                                : "—"}
                        </span>
                    }
                />
            ))}
        </ul>
    )
}
