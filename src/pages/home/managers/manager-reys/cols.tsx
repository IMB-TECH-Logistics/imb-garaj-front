import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
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
