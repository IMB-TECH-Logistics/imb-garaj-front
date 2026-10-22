import { AlertsList } from "@/components/alerts/alerts-list"
import { ResolveAlertDialog } from "@/components/alerts/resolve-alert-dialog"
import type { AlertItem } from "@/components/alerts/types"
import { useAlertCounts } from "@/components/alerts/use-alert-counts"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    MANAGERS_ORDERS,
    MANAGERS_ORDERS_INTEGRATION_COUNT,
    WAREHOUSE_LOW_STOCK,
} from "@/constants/api-endpoints"
import { useHasAction, useWarehouseOwner } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import type { WhLowStock } from "@/pages/home/ombor/types"
import { Bell, ArrowRight, Boxes, Check, Package, TriangleAlert } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export function IntegrationNotification() {
    const { t } = useTranslation()
    const canSeeWarehouse = useHasAction(["warehouse_view", "warehouse_control"])
    const isOwner = useWarehouseOwner() && canSeeWarehouse
    const hasControl = useHasAction("warehouse_control")
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [approvingId, setApprovingId] = useState<number | null>(null)
    const [open, setOpen] = useState(false)
    const canApprove = useHasAction("manager_vehicles_control")
    const canIntegration = useHasAction("manager_vehicles_view")
    const { canSee: canAlerts, total: alertsTotal } = useAlertCounts()
    const [tab, setTab] = useState<"open" | "resolved">("open")
    const [resolving, setResolving] = useState<AlertItem | null>(null)

    const { data: countData, isError } = useGet<{ count: number }>(
        MANAGERS_ORDERS_INTEGRATION_COUNT,
        { enabled: canIntegration, options: { refetchInterval: 30_000, staleTime: 25_000 } },
    )

    const count = countData?.count ?? 0

    const { data: lowStock } = useGet<{ count: number; results: WhLowStock[] }>(
        WAREHOUSE_LOW_STOCK,
        {
            enabled: isOwner,
            options: { refetchInterval: 45_000, staleTime: 40_000 },
        },
    )
    const lowItems = isOwner ? (lowStock?.results ?? []) : []
    const total = count + alertsTotal + lowItems.length

    const { data: ordersData, isLoading, isError: ordersError } = useGet<ListResponse<ManagerOrders>>(
        MANAGERS_ORDERS,
        {
            enabled: canIntegration,
            params: { is_integration: "true", trip_confirmed: "false", page_size: 100, ordering: "-id" },
        },
    )

    const { mutate: approve } = usePost({})

    const orders = ordersData?.results ?? []

    const handleOpenChange = (val: boolean) => {
        setOpen(val)
    }

    const handleOpenTrip = (alert: AlertItem) => {
        setOpen(false)
        navigate({
            to: "/manager-trips/$id",
            params: { id: String(alert.vehicle.id) },
            search: {
                name: alert.vehicle.truck_number,
                create_trip: 1,
                ...(alert.driver ? { driver: alert.driver.id } : {}),
            },
        } as any)
    }

    const handleResolve = (alert: AlertItem) => {
        setOpen(false)
        setResolving(alert)
    }

    const handleApprove = (id: number) => {
        setApprovingId(id)
        approve(
            `${MANAGERS_ORDERS}/${id}/approve`,
            {},
            {
                onSuccess: () => {
                    toast.success(t("ui.integration.approved_toast"))
                    queryClient.invalidateQueries({ queryKey: [MANAGERS_ORDERS] })
                    queryClient.invalidateQueries({ queryKey: [MANAGERS_ORDERS_INTEGRATION_COUNT] })
                },
                onError: () => {
                    toast.error(t("ui.integration.approve_error"))
                },
                onSettled: () => {
                    setApprovingId(null)
                },
            },
        )
    }

    if (canIntegration && (isError || ordersError)) {
        return (
            <Button variant="default" size="icon" className="relative size-9 shrink-0" aria-label={t("ui.integration.title")} disabled>
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                    !
                </span>
            </Button>
        )
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="default" size="icon" className="relative size-9 shrink-0" aria-label={t("ui.integration.title")}>
                    <Bell size={18} />
                    {total > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                            {total > 99 ? "99+" : total}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 max-w-[calc(100vw-1.5rem)] p-0">
                <div className="px-4 py-3 border-b border-border space-y-2">
                    <p className="text-sm font-semibold">{t("alerts.bell_title")}</p>
                    {canAlerts && (
                        <Tabs value={tab} onValueChange={(value) => setTab(value as "open" | "resolved")}>
                            <TabsList className="h-8 w-full">
                                <TabsTrigger value="open" className="flex-1 py-1">
                                    {t("alerts.tab_open")}
                                    {alertsTotal > 0 && ` (${alertsTotal})`}
                                </TabsTrigger>
                                <TabsTrigger value="resolved" className="flex-1 py-1">
                                    {t("alerts.tab_resolved")}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}
                    {canIntegration && tab === "open" && (
                        <p className="text-xs text-muted-foreground">
                            {t("ui.integration.unconfirmed_count", { count })}
                        </p>
                    )}
                </div>
                <div className="max-h-[65vh] overflow-y-auto">
                    {canAlerts && (
                        <AlertsList status={tab} onOpenTrip={handleOpenTrip} onResolve={handleResolve} />
                    )}
                    {canIntegration && tab === "open" && (
                        <>
                        <div className="divide-y divide-border">
                            {isLoading ? (
                                <p className="text-sm text-muted-foreground text-center py-6">{t("messages.loading")}</p>
                            ) : orders.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">{t("ui.integration.no_trips")}</p>
                            ) : orders.map((order) => {
                                const isApproving = approvingId === order.id
                                const isDraft = order.trip_confirmed === false
                                return (
                                    <div
                                        key={order.id}
                                        className={`flex items-start gap-1 pr-2 transition-colors ${isApproving ? "opacity-40" : "hover:bg-muted/50"}`}
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
                                                    {isDraft ? (
                                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-orange-300 text-orange-600">
                                                            {t("ui.integration.unconfirmed")}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-green-300 text-green-600">
                                                            {t("ui.integration.confirmed")}
                                                        </Badge>
                                                    )}
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
                                                            {format(new Date(order.pending_time), "dd/MM HH:mm")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ArrowRight size={14} className="mt-0.5 text-muted-foreground shrink-0" />
                                        </button>
                                        {isDraft ? (
                                            canApprove && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                disabled={isApproving}
                                                className="mt-2 h-7 px-2 text-xs text-green-600 hover:bg-green-100 hover:text-green-700 shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (!isApproving) handleApprove(order.id)
                                                }}
                                            >
                                                {t("actions.confirm")}
                                            </Button>
                                            )
                                        ) : (
                                            <span className="mt-3 p-1 text-green-500 shrink-0" title={t("ui.integration.confirmed")}>
                                                <Check size={15} />
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        {orders.length > 0 && (
                            <div className="border-t border-border p-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-xs text-primary"
                                    onClick={() => {
                                        setOpen(false)
                                        navigate({
                                            to: "/manager-trips/manager-reys/$id",
                                            params: { id: "all" },
                                            search: { is_integration: "true", trip_confirmed: "false" },
                                        } as any)
                                    }}
                                >
                                    {t("reys_bulk.view_all")}
                                </Button>
                            </div>
                        )}
                        </>
                    )}
                </div>
                {isOwner && tab === "open" && (
                    <div className="border-t border-border">
                        <div className="px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Boxes size={14} className="text-primary" />
                            {t("wh.low_stock.title")}
                        </div>
                        <div className="max-h-64 overflow-y-auto p-1">
                            {lowItems.length === 0 ?
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    {t("wh.low_stock.ok")}
                                </p>
                            :   lowItems.map((item) => {
                                    const left = Number(item.qty_left)
                                    return (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3 rounded-sm px-2 py-2 hover:bg-muted/50"
                                        >
                                            <div
                                                className={`size-8 rounded-md grid place-items-center shrink-0 ${left > 0 ? "bg-red-500/10 text-red-500" : "bg-secondary text-muted-foreground"}`}
                                            >
                                                {left > 0 ?
                                                    <TriangleAlert size={16} />
                                                :   <Package size={16} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium truncate">
                                                    {item.name}
                                                </div>
                                                <div
                                                    className={`text-xs tabular-nums ${left > 0 ? "text-red-600" : "text-muted-foreground"}`}
                                                >
                                                    {t("wh.low_stock.row", {
                                                        left,
                                                        min: Number(item.min_quantity),
                                                        unit: item.unit_name,
                                                    })}
                                                    {left > 0 ? "" : ` · ${t("wh.low_stock.empty")}`}
                                                </div>
                                            </div>
                                            {hasControl && (
                                                <button
                                                    type="button"
                                                    className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
                                                    onClick={() => {
                                                        setOpen(false)
                                                        navigate({
                                                            to: "/ombor",
                                                            search: { receipt: 1 },
                                                        })
                                                    }}
                                                >
                                                    {t("wh.low_stock.receipt")}
                                                </button>
                                            )}
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                )}
            </PopoverContent>
            <ResolveAlertDialog alert={resolving} onClose={() => setResolving(null)} />
        </Popover>
    )
}
