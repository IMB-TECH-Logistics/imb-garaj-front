import { Button } from "@/components/ui/button"
import { MANAGERS_TRIPS } from "@/constants/api-endpoints"
import { useHasAction, useUser } from "@/constants/useUser"
import { useModal } from "@/hooks/useModal"
import { formatMoney, formatNumber } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle, HandCoins, SquarePen, Trash2 } from "lucide-react"
import AdvanceBadge from "./advance-badge"

export const STATUS_TRIP: Record<number, string> = {
    0: "trips.status.pending",
    1: "trips.status.started",
    5: "trips.status.loading",
    6: "trips.status.on_road",
    7: "trips.status.unloading",
    2: "trips.status.finished",
    3: "trips.status.cancelled",
    4: "trips.status.archived",
}

export const useColumnsManagersTrips = (opts?: {
    onMoliya?: (item: ManagerTrips) => void
    onEdit?: (item: ManagerTrips) => void
    onDelete?: (item: ManagerTrips) => void
}) => {
    const { t } = useTranslation()
    const { onMoliya, onEdit, onDelete } = opts || {}
    const hasControl = useHasAction("manager_vehicles_control")
    const { data: me } = useUser()
    const canCloseTrip = useHasAction("kassa_trip_close_control")
    const canFinish = hasControl && (!(me?.kassa_mode === "driver_cash" && me?.kassa_version === 2) || canCloseTrip)
    const { openModal: openFinished } = useModal(`${MANAGERS_TRIPS}-finished`)
    const { setData } = useGlobalStore()
    const handleFinished = (item: ManagerTrips) => {
        setData("finished", item)
        openFinished()
    }

    return useMemo<ColumnDef<ManagerTrips>[]>(
        () => [
            {
                accessorKey: "start",
                header: t("table.start_time"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="">{row.original.start || "-"}</div>
                ),
            },
            {
                accessorKey: "end",
                header: t("table.end_time"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="">{row.original.end || "-"}</div>
                ),
            },
            {
                accessorKey: "driver_name",
                header: t("form.driver"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="flex flex-col gap-1">
                        <span className="whitespace-nowrap">{row.original.driver_name || "-"}</span>
                        <AdvanceBadge
                            compact
                            pending={(row.original as any).pending_advance}
                            rejected={(row.original as any).rejected_advance}
                        />
                    </div>
                ),
            },
            {
                accessorKey: "completed_order_count",
                header: t("page.trips"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{row.original.completed_order_count || "0"}</div>
                ),
            },
            {
                accessorKey: "pending_order_count",
                header: t("table.pending_trips"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{row.original.pending_order_count || "0"}</div>
                ),
            },
            // {
            //     accessorKey: "status",
            //     header: "Aylanma statusi",
            //     enableSorting: true,
            //     cell: ({ row }) => {
            //         const status = row.original?.status
            //         return <div>{STATUS_LABELS[status] || "-"}</div>
            //     },
            // },

            {
                accessorKey: "start_mileage",
                header: t("table.start_mileage"),
                enableSorting: true,
                cell: ({ row }) => {
                    return <div>{formatMoney(row.original.start_mileage)}</div>
                },
            },
            {
                accessorKey: "end_mileage",
                header: t("table.end_mileage"),
                enableSorting: true,
                cell: ({ row }) => {
                    return <div>{formatMoney(row.original.end_mileage)}</div>
                },
            },
            {
                id: "distance",
                header: t("table.distance_km"),
                cell: ({ row }) => {
                    const start = Number(row.original.start_mileage ?? 0)
                    const end = Number(row.original.end_mileage ?? 0)
                    if (!row.original.end_mileage || end <= start) return <div>-</div>
                    return <div className="font-medium">{formatMoney(end - start)}</div>
                },
            },
            {
                accessorKey: "start_fuel",
                header: t("table.start_fuel"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatNumber((row.original as any).start_fuel)}</div>
                ),
            },
            {
                accessorKey: "end_fuel",
                header: t("table.end_fuel"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatNumber((row.original as any).end_fuel)}</div>
                ),
            },
            {
                accessorKey: "used_fuel",
                header: t("table.used_fuel"),
                cell: ({ row }) =>
                    row.original.end ?
                        <div className="font-medium">{formatNumber((row.original as any).used_fuel ?? 0)}</div>
                    :   <div>-</div>,
            },
            {
                id: "fuel_per_100km",
                header: t("table.fuel_per_km"),
                enableSorting: true,
                accessorFn: (row) => {
                    const startFuel = Number((row as any).start_fuel ?? 0)
                    const endFuel = Number((row as any).end_fuel ?? 0)
                    const distance = Number(row.end_mileage ?? 0) - Number(row.start_mileage ?? 0)
                    // Backend used_fuel = boshlang'ich + reysda quyilgan - qolgan (TripService.used_fuel)
                    const usedFuel = (row as any).used_fuel
                    const liters = usedFuel != null ? Number(usedFuel) : startFuel - endFuel
                    if (distance <= 0 || liters <= 0) return 0
                    return (liters / distance) * 100
                },
                cell: ({ row }) => {
                    const startFuel = Number((row.original as any).start_fuel ?? 0)
                    const endFuel = Number((row.original as any).end_fuel ?? 0)
                    const distance =
                        Number(row.original.end_mileage ?? 0) -
                        Number(row.original.start_mileage ?? 0)
                    const usedFuel = (row.original as any).used_fuel
                    const liters = usedFuel != null ? Number(usedFuel) : startFuel - endFuel
                    if (distance <= 0 || liters <= 0) return <div>-</div>
                    return <div>{((liters / distance) * 100).toFixed(1)}</div>
                },
            },
            {
                accessorKey: "cash_flow_sum",
                header: t("form.expense"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatMoney(row.original.cash_flow_sum)}</div>
                ),
            },

            {
                id: "actions",
                header: " ",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-2 py-2">
                        {canFinish && !row.original.end && (
                            <Button
                                size="sm"
                                className="bg-green-500/10 text-green-600 hover:bg-green-500/15"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleFinished(row.original)
                                }}
                            >
                                <CheckCircle size={14} />
                                {t("actions.finish")}
                            </Button>
                        )}
                        <Button
                            size="sm"
                            className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/15 dark:text-blue-400"
                            onClick={(e) => {
                                e.stopPropagation()
                                onMoliya?.(row.original)
                            }}
                        >
                            <HandCoins size={14} />
                            {t("trips.managers_trips.finance")}
                        </Button>
                        {hasControl && (
                            <>
                                <Button
                                    icon={<SquarePen className="text-primary" size={16} />}
                                    size="sm"
                                    className="p-0 h-3"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onEdit?.(row.original)
                                    }}
                                />
                                <Button
                                    icon={<Trash2 className="text-red-500" size={16} />}
                                    size="sm"
                                    className="p-0 h-3"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDelete?.(row.original)
                                    }}
                                />
                            </>
                        )}
                    </div>
                ),
            },
        ],
        [onMoliya, onEdit, onDelete, t, canFinish, hasControl],
    )
}
