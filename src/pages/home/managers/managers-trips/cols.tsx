import { Button } from "@/components/ui/button"
import { MANAGERS_TRIPS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle, HandCoins, SquarePen, Trash2 } from "lucide-react"

export const STATUS_TRIP: Record<number, string> = {
    0: "Kutilmoqda",
    1: "Boshlandi",
    5: "Yuklanmoqda",
    6: "Yo'lda",
    7: "Tushirilmoqda",
    2: "Tugallandi",
    3: "Bekor qilindi",
    4: "Arxivlangan",
}

export const useColumnsManagersTrips = (opts?: {
    onMoliya?: (item: ManagerTrips) => void
    onEdit?: (item: ManagerTrips) => void
    onDelete?: (item: ManagerTrips) => void
}) => {
    const { t } = useTranslation()
    const { onMoliya, onEdit, onDelete } = opts || {}
    const hasControl = useHasAction("manager_vehicles_control")
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
                cell: ({ row }) => <div>{row.original.driver_name || "-"}</div>,
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
                accessorKey: "start_fuel",
                header: t("table.fuel_l"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatMoney((row.original as any).start_fuel)}</div>
                ),
            },
            {
                accessorKey: "end_fuel",
                header: t("table.fuel_l"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatMoney((row.original as any).end_fuel)}</div>
                ),
            },
            {
                id: "fuel_per_100km",
                header: t("table.fuel_per_km"),
                enableSorting: true,
                accessorFn: (row) => {
                    const startFuel = Number((row as any).start_fuel ?? 0)
                    const endFuel = Number((row as any).end_fuel ?? 0)
                    const distance = Number(row.end_mileage ?? 0) - Number(row.start_mileage ?? 0)
                    const liters = startFuel - endFuel
                    if (distance <= 0 || liters <= 0) return 0
                    return (liters / distance) * 100
                },
                cell: ({ row }) => {
                    const startFuel = Number((row.original as any).start_fuel ?? 0)
                    const endFuel = Number((row.original as any).end_fuel ?? 0)
                    const distance =
                        Number(row.original.end_mileage ?? 0) -
                        Number(row.original.start_mileage ?? 0)
                    const liters = startFuel - endFuel
                    if (distance <= 0 || liters <= 0) return <div>-</div>
                    return <div>{((liters / distance) * 100).toFixed(1)}</div>
                },
            },
            {
                accessorKey: "income_uzs",
                header: `${t("form.income")} (uzs)`,
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatMoney(row.original.income_uzs)}</div>
                ),
            },
            {
                accessorKey: "income_usd",
                header: `${t("form.income")} (usd)`,
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatMoney(row.original.income_usd)}</div>
                ),
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
                        {hasControl && !row.original.end && (
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
                            icon={<HandCoins className="text-blue-500" size={16} />}
                            size="sm"
                            className="p-0 h-3"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation()
                                onMoliya?.(row.original)
                            }}
                        />
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
        [onMoliya, onEdit, onDelete, t],
    )
}
