import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

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
    const { t } = useTranslation()
    return useMemo<ColumnDef<VehicleExpenseRow>[]>(
        () => [
            {
                header: t("table.truck_plate"),
                accessorKey: "vehicle_name",
                size: 120,
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.vehicle_name || "—"}</span>
                ),
            },
            {
                header: t("form.expense_type"),
                accessorKey: "category_name",
                size: 150,
                enableSorting: true,
            },
            {
                header: t("form.amount"),
                accessorKey: "amount",
                size: 130,
                enableSorting: true,
                cell: ({ row }) => {
                    const v = Number(row.original.amount ?? 0) || 0
                    return <span className="font-medium text-red-600">{formatMoney(v)}</span>
                },
            },
            {
                header: t("form.date"),
                accessorKey: "date",
                size: 110,
                enableSorting: true,
            },
            {
                header: t("form.lifespan"),
                accessorKey: "lifespan",
                size: 110,
                enableSorting: true,
            },
            {
                header: t("table.responsible"),
                accessorKey: "executor_name",
                size: 140,
                enableSorting: true,
                cell: ({ row }) => (
                    <span>{row.original.executor_name || "—"}</span>
                ),
            },
            {
                header: t("form.comment"),
                accessorKey: "comment",
                size: 200,
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="text-muted-foreground">{row.original.comment || "—"}</span>
                ),
            },
        ],
        [t],
    )
}
