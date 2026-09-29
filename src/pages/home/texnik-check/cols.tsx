import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
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
    is_latest?: boolean
    status?: "ok" | "expiring" | "expired" | null
    days_left?: number | null
    comment: string
    amount: string | number
    executor: number | null
    executor_name: string | null
    created: string
}

const STATUS_CLASSES: Record<string, string> = {
    expired:
        "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800 font-semibold",
    expiring:
        "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800 font-semibold",
}

export const lifespanHint = (days: number | null | undefined) => {
    if (days === null || days === undefined) return ""
    if (days < 0) return `${-days} kun oldin tugagan`
    if (days === 0) return "Bugun tugaydi"
    return `${days} kun qoldi`
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
                cell: ({ row }) => {
                    const { lifespan, status, days_left } = row.original
                    const alert = status === "expired" || status === "expiring"
                    return (
                        <span
                            title={alert ? lifespanHint(days_left) : undefined}
                            className={cn(
                                "rounded-md border border-transparent px-2 py-0.5 tabular-nums",
                                alert && STATUS_CLASSES[status as string],
                            )}
                        >
                            {lifespan}
                        </span>
                    )
                },
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
