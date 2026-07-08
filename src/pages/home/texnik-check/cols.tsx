import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

export type VehicleExpenseRow = {
    id: number
    vehicle: number
    vehicle_name: string
    category: number
    category_name: string
    date: string
    lifespan: string
    comment: string
    amount: string | number
    executor: number | null
    executor_name: string | null
    created: string
}

export const useExpenseCols = () => {
    return useMemo<ColumnDef<VehicleExpenseRow>[]>(
        () => [
            {
                header: "Avto raqam",
                accessorKey: "vehicle_name",
                size: 120,
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.vehicle_name || "—"}</span>
                ),
            },
            {
                header: "Xarajat turi",
                accessorKey: "category_name",
                size: 150,
                enableSorting: true,
            },
            {
                header: "Summa",
                accessorKey: "amount",
                size: 130,
                enableSorting: true,
                cell: ({ row }) => {
                    const v = Number(row.original.amount ?? 0) || 0
                    return <span className="font-medium text-red-600">{formatMoney(v)}</span>
                },
            },
            {
                header: "Sana",
                accessorKey: "date",
                size: 110,
                enableSorting: true,
            },
            {
                header: "Amal muddati",
                accessorKey: "lifespan",
                size: 110,
                enableSorting: true,
            },
            {
                header: "Mas'ul",
                accessorKey: "executor_name",
                size: 140,
                enableSorting: true,
                cell: ({ row }) => (
                    <span>{row.original.executor_name || "—"}</span>
                ),
            },
            {
                header: "Izoh",
                accessorKey: "comment",
                size: 200,
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="text-muted-foreground">{row.original.comment || "—"}</span>
                ),
            },
        ],
        [],
    )
}
