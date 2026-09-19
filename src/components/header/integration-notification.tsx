import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MANAGERS_ORDERS, MANAGERS_ORDERS_INTEGRATION_COUNT } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { usePatch } from "@/hooks/usePatch"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Bell, ArrowRight, Check } from "lucide-react"
import { useState } from "react"

export function IntegrationNotification() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [seenIds, setSeenIds] = useState<Set<number>>(new Set())
    const [open, setOpen] = useState(false)

    const { data: countData, isError } = useGet<{ count: number }>(
        MANAGERS_ORDERS_INTEGRATION_COUNT,
        { options: { refetchInterval: 30_000, staleTime: 25_000 } },
    )

    const count = countData?.count ?? 0
    const displayCount = Math.max(0, count - seenIds.size)

    const { data: ordersData, isLoading, isError: ordersError } = useGet<ListResponse<ManagerOrders>>(
        MANAGERS_ORDERS,
        {
            params: { is_integration: "true", status: 0, page_size: 50 },
            enabled: count > 0,
        },
    )

    const { mutate: markSeen } = usePatch({})

    const orders = ordersData?.results ?? []

    const handleOpenChange = (val: boolean) => {
        if (!val && seenIds.size > 0) {
            setSeenIds(new Set())
            queryClient.invalidateQueries({ queryKey: [MANAGERS_ORDERS] })
            queryClient.invalidateQueries({ queryKey: [MANAGERS_ORDERS_INTEGRATION_COUNT] })
        }
        setOpen(val)
    }

    const handleSeen = (id: number) => {
        setSeenIds((prev) => new Set(prev).add(id))
        markSeen(`${MANAGERS_ORDERS}/${id}/seen`, {})
    }

    if (isError || ordersError) {
        return (
            <Button variant="ghost" size="icon" className="relative" disabled>
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                    !
                </span>
            </Button>
        )
    }

    if (count === 0) return null

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell size={18} />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                        {displayCount > 99 ? "99+" : displayCount}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold">Logistikadan yangi reyslar</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {displayCount} ta kutilayotgan reys
                    </p>
                </div>
                <div className="divide-y divide-border max-h-64 overflow-y-auto">
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Yuklanmoqda...</p>
                    ) : orders.map((order) => {
                        const seen = seenIds.has(order.id)
                        return (
                            <div
                                key={order.id}
                                className={`flex items-start gap-1 pr-2 transition-colors ${seen ? "opacity-40" : "hover:bg-muted/50"}`}
                            >
                                <button
                                    type="button"
                                    className="flex-1 text-left px-4 py-3 flex items-start justify-between gap-2 min-w-0"
                                    onClick={() => {
                                        if (order.trip == null) return
                                        navigate({
                                            to: "/manager-trips/manager-reys/$id",
                                            params: { id: String(order.trip) },
                                        })
                                    }}
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {order.loading_name} → {order.unloading_name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {order.truck_number && (
                                                <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                                    {order.truck_number}
                                                </Badge>
                                            )}
                                            {seen && (
                                                <span className="text-[10px] text-green-600 font-medium">Ko'rildi</span>
                                            )}
                                            {order.logistics_distributor_code && (
                                                <span className="text-xs text-muted-foreground">
                                                    {order.logistics_distributor_code}
                                                </span>
                                            )}
                                            {order.pending_time && (
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(order.pending_time).toLocaleString("uz-UZ", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="mt-0.5 text-muted-foreground shrink-0" />
                                </button>
                                <button
                                    type="button"
                                    title="Ko'rib chiqdim"
                                    disabled={seen}
                                    className={`mt-3 p-1 rounded transition-colors shrink-0 ${
                                        seen
                                            ? "text-green-500 cursor-default"
                                            : "hover:bg-green-100 hover:text-green-600 text-muted-foreground"
                                    }`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (!seen) handleSeen(order.id)
                                    }}
                                >
                                    <Check size={15} />
                                </button>
                            </div>
                        )
                    })}
                </div>
                {count > 50 && (
                    <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground text-center">
                        Va yana {count - 50} ta...
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
