import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MANAGERS_ORDERS, MANAGERS_ORDERS_INTEGRATION_COUNT } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { usePatch } from "@/hooks/usePatch"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Bell, ArrowRight, Check } from "lucide-react"

export function IntegrationNotification() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { data: countData, isError } = useGet<{ count: number }>(
        MANAGERS_ORDERS_INTEGRATION_COUNT,
        { options: { refetchInterval: 30_000, staleTime: 25_000 } },
    )

    const count = countData?.count ?? 0

    const { data: ordersData, isLoading, isError: ordersError } = useGet<ListResponse<ManagerOrders>>(
        MANAGERS_ORDERS,
        {
            params: { is_integration: "true", status: 0, page_size: 10 },
            enabled: count > 0,
        },
    )

    const { mutate: markSeen } = usePatch({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [MANAGERS_ORDERS_INTEGRATION_COUNT] })
            queryClient.invalidateQueries({ queryKey: [MANAGERS_ORDERS] })
        },
    })

    const orders = ordersData?.results ?? []

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
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell size={18} />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                        {count > 99 ? "99+" : count}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold">Logistikadan yangi reyslar</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {count} ta kutilayotgan reys
                    </p>
                </div>
                <div className="divide-y divide-border max-h-64 overflow-y-auto">
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Yuklanmoqda...</p>
                    ) : orders.map((order) => (
                        <div key={order.id} className="flex items-start gap-1 pr-2 hover:bg-muted/50 transition-colors">
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
                                className="mt-3 p-1 rounded hover:bg-green-100 hover:text-green-600 text-muted-foreground transition-colors shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    markSeen(`${MANAGERS_ORDERS}/${order.id}/seen`, {})
                                }}
                            >
                                <Check size={15} />
                            </button>
                        </div>
                    ))}
                </div>
                {count > 10 && (
                    <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground text-center">
                        Va yana {count - 10} ta...
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
