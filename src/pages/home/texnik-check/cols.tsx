import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { ExpenseItem } from "./types"

export type VehicleExpenseRow = {
    id: number
    vehicle: number
    vehicle_name: string
    category: number
    category_name: string
    category_code: string | null
    date: string
    comment: string
    amount: string | number | null
    warehouse_total: string | null
    items: ExpenseItem[]
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
                header: t("form.date"),
                accessorKey: "date",
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
