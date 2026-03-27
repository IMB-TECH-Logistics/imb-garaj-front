import { Button } from "@/components/ui/button"
import { MANAGERS_TRIPS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { CheckCircle, HandCoins, SquarePen, Trash2 } from "lucide-react"
export const STATUS_LABELS: any = {
    1: "Band",
    2: "Bo'sh",
    3: "Ta'mirda",
}

export const STATUS_TRIP: any = {
    0: "Kutilmoqda",
    1: "Boshlandi",
    2: "Tugallandi",
    4: "Bekor qilindi",
}

export const useColumnsManagersTrips = (opts?: {
    onMoliya?: (item: ManagerTrips) => void
    onEdit?: (item: ManagerTrips) => void
    onDelete?: (item: ManagerTrips) => void
}) => {
    const { onMoliya, onEdit, onDelete } = opts || {}
    const { openModal: openFinished } = useModal(`${MANAGERS_TRIPS}-finished`)
    const { setData, getData } = useGlobalStore()
    const handleFinished = (item: ManagerTrips) => {
        setData("finished", item)
        openFinished()
    }

    return useMemo<ColumnDef<ManagerTrips>[]>(
        () => [
            {
                accessorKey: "start",
                header: "Chiqib ketgan vaqt",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="">{row.original.start || "-"}</div>
                ),
            },
            {
                accessorKey: "end",
                header: "Tugallangan vaqti",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="">{row.original.end || "-"}</div>
                ),
            },
            {
                accessorKey: "driver_name",
                header: "Haydovchi",
                enableSorting: true,
                cell: ({ row }) => <div>{row.original.driver_name || "-"}</div>,
            },
            {
                accessorKey: "completed_order_count",
                header: "Yakunlangan reyslar",
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{(row.original as any).completed_order_count || "0"}</div>
                ),
            },
            {
                accessorKey: "pending_order_count",
                header: "Kutilayotgan reyslar",
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
                accessorKey: "income_uzs",
                header: "Tushum (uzs)",
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatMoney(row.original.income_uzs)}</div>
                ),
            },
            {
                accessorKey: "income_usd",
                header: "Tushum (usd)",
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatMoney(row.original.income_usd)}</div>
                ),
            },
            {
                accessorKey: "start_mileage",
                header: "Kirish probegi",
                enableSorting: true,
                cell: ({ row }) => {
                    return <div>{formatMoney(row.original.start_mileage)}</div>
                },
            },

            {
                accessorKey: "end_mileage",
                header: "Chiqish probegi",
                enableSorting: true,
                cell: ({ row }) => {
                    return <div>{formatMoney(row.original.end_mileage)}</div>
                },
            },

            {
                accessorKey: "cash_flow_sum",
                header: "Xarajat",
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatMoney(row.original.cash_flow_sum)}</div>
                ),
            },
            {
                accessorKey: "fuel_consume",
                header: "Yoqilg'i sarfi",
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatMoney(row.original.fuel_consume)}</div>
                ),
            },

            {
                id: "actions",
                header: " ",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-2 py-2">
                        {!row.original.end && (
                            <Button
                                size="sm"
                                className="bg-green-500/10 text-green-600 hover:bg-green-500/15"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleFinished(row.original)
                                }}
                            >
                                <CheckCircle size={14} />
                                Tugatish
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
                    </div>
                ),
            },
        ],
        [onMoliya, onEdit, onDelete],
    )
}
