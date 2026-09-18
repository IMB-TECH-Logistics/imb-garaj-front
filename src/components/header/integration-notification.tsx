import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MANAGERS_ORDERS, MANAGERS_ORDERS_INTEGRATION_COUNT } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useNavigate } from "@tanstack/react-router"
import { Bell, ArrowRight } from "lucide-react"

export function IntegrationNotification() {
    const navigate = useNavigate()

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
                        <button
                            key={order.id}
                            type="button"
                            className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-start justify-between gap-2"
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
                                <div className="flex items-center gap-2 mt-1">
                                    {order.external_id && (
                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                            {order.external_id}
                                        </Badge>
                                    )}
                                    {order.logistics_distributor_code && (
                                        <span className="text-xs text-muted-foreground">
                                            {order.logistics_distributor_code}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ArrowRight size={14} className="mt-0.5 text-muted-foreground shrink-0" />
                        </button>
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
