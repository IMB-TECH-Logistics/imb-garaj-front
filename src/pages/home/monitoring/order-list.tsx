import { Badge } from "@/components/ui/badge"
import { Coins, Package, Truck, User2 } from "lucide-react"
import {
    DimensionEmpty,
    DimensionListSkeleton,
    DimensionRow,
} from "./dimension-row"
import type { OrderTracking } from "./types"

const STATUS_LABEL: Record<number, string> = {
    [-1]: "Draft",
    0: "Pending",
    1: "Started",
    5: "Loading",
    6: "In Transit",
    7: "Unloading",
    2: "Completed",
    3: "Canceled",
    4: "Archived",
}

const ACTIVE_STATUSES = new Set([1, 5, 6, 7])

type Props = {
    items: OrderTracking[]
    loading?: boolean
    activeId?: number | null
    onSelect?: (order: OrderTracking) => void
}

export default function OrderList({
    items,
    loading,
    activeId,
    onSelect,
}: Props) {
    if (loading && items.length === 0) return <DimensionListSkeleton />
    if (!loading && items.length === 0) {
        return (
            <DimensionEmpty
                title="GPS izi bor order topilmadi"
                hint="Filtrlardan birini o'zgartiring"
            />
        )
    }

    return (
        <ul className="flex flex-col gap-1.5">
            {items.map((order, i) => (
                <DimensionRow
                    key={order.id}
                    index={i}
                    active={order.id === activeId}
                    secondsSince={order.seconds_since}
                    onClick={() => onSelect?.(order)}
                    primary={`Order #${order.id}`}
                    badge={
                        <span className="flex items-center gap-1">
                            <Badge
                                variant={
                                    ACTIVE_STATUSES.has(order.status)
                                        ? "default"
                                        : "secondary"
                                }
                                className="h-5 px-1.5 text-[10px] font-medium"
                            >
                                {STATUS_LABEL[order.status] ?? "—"}
                            </Badge>
                            {order.is_integration && (
                                <Badge
                                    variant="orange"
                                    className="h-5 px-1.5 text-[10px] font-medium"
                                >
                                    Integratsiya
                                </Badge>
                            )}
                        </span>
                    }
                    secondary={
                        <>
                            {order.driver_name && (
                                <span className="inline-flex items-center gap-1 truncate">
                                    <User2 className="h-3 w-3 shrink-0" />
                                    <span className="truncate">
                                        {order.driver_name}
                                    </span>
                                </span>
                            )}
                            {order.vehicle_number && (
                                <span className="inline-flex items-center gap-1">
                                    <Truck className="h-3 w-3" />
                                    <span className="font-mono tracking-wide">
                                        {order.vehicle_number}
                                    </span>
                                </span>
                            )}
                            {order.client_name && (
                                <span className="inline-flex items-center gap-1 truncate">
                                    <Package className="h-3 w-3 shrink-0" />
                                    <span className="truncate">
                                        {order.client_name}
                                    </span>
                                </span>
                            )}
                            {order.is_integration && Number(order.amount) > 0 && (
                                <span className="inline-flex items-center gap-1 text-orange-600 font-medium">
                                    <Coins className="h-3 w-3 shrink-0" />
                                    <span>
                                        {Number(order.amount).toLocaleString()}
                                    </span>
                                </span>
                            )}
                        </>
                    }
                />
            ))}
        </ul>
    )
}
