import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"
import { STATUS_LABELS, STATUS_TRIP } from "../managers-trips/cols"
export const useColumnsManagersOrders = () => {
    return useMemo<ColumnDef<ManagerOrders>[]>(
        () => [
            {
                accessorKey: "loading_name",
                header: "Yuklash joyi",
                enableSorting: true,
            },
            {
                accessorKey: "unloading_name",
                header: "Tushirish joyi",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="">{row.original.loading_name || "-"}</div>
                ),
            },
            {
                accessorKey: "cargo_type_name",
                header: "Yuk turi",
                enableSorting: true,
            },
            {
                accessorKey: "date",
                header: "Yaratilagan sana",
                enableSorting: true,
            },
            {
                accessorKey: "type",
                header: "Holati",
                enableSorting: true,
                cell: ({ row }) => {
                    const status = row.original?.type
                    return <div>{STATUS_LABELS[status] || "-"}</div>
                },
            },
            {
                accessorKey: "payment_amount_uzs",
                header: "Tushum (uzs / usd)",
                enableSorting: true,
                cell: ({ row }) => {
                    const moneyUzs = row.original?.payment_amount_uzs
                    const moneyUsd = row.original?.payment_amount_usd

                    if (moneyUsd) {
                        return <div>{formatMoney(moneyUsd)} USD</div>
                    }

                    if (moneyUzs) {
                        return <div>{formatMoney(moneyUzs)} UZS</div>
                    }

                    return "-"
                },
            },
            {
                accessorKey: "pending_time",
                header: "Pending vaqt",
                cell: ({ row }) => formatDateSafe(row.original.pending_time),
            },
            {
                accessorKey: "started_time",
                header: "Boshlangan vaqt",
                cell: ({ row }) => formatDateSafe(row.original.started_time),
            },
            {
                accessorKey: "loading_time",
                header: "Yuklash vaqti",
                cell: ({ row }) => formatDateSafe(row.original.loading_time),
            },
            {
                accessorKey: "in_transit_time",
                header: "Yo‘lda",
                cell: ({ row }) => formatDateSafe(row.original.in_transit_time),
            },
            {
                accessorKey: "unloading_time",
                header: "Tushirish vaqti",
                cell: ({ row }) => formatDateSafe(row.original.unloading_time),
            },
            {
                accessorKey: "completed_time",
                header: "Yakunlangan",
                cell: ({ row }) => formatDateSafe(row.original.completed_time),
            },
            {
                accessorKey: "canceled_time",
                header: "Bekor qilingan",
                cell: ({ row }) => formatDateSafe(row.original.canceled_time),
            },
            {
                accessorKey: "archived_time",
                header: "Arxivlangan",
                cell: ({ row }) => formatDateSafe(row.original.archived_time),
            },
            {
                accessorKey: "status",
                header: "Status",
                enableSorting: true,
                cell: ({ row }) => {
                    const status = row.original?.status
                    return <div>{STATUS_TRIP[status] || "-"}</div>
                },
            },
        ],
        [],
    )
}

const formatDateSafe = (value?: string) => {
    if (!value) return "-"

    const date = new Date(value)

    if (isNaN(date.getTime())) return "-"

    return format(date, "yyyy-MM-dd")
}
