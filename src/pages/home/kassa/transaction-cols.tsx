import { format } from "date-fns"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { TransactionTypeCell } from "./transaction-type-cell"

export type Transaction = {
    id: number
    amount: string
    comment: string | null
    executor_name: string
    created: string
    type: number
    status: number
    checkout_kind: "cash" | "card"
    through: string | null
    driver_name: string | null
    vehicle_plate: string | null
    source: string | null
    is_unconfirmed?: boolean
    awaiting_order_completion?: boolean
}

export const useTransactionCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<Transaction>[]>(
        () => [
            {
                header: t("form.amount"),
                accessorKey: "amount",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className={row.original.awaiting_order_completion ? "text-muted-foreground" : undefined}>
                        {formatMoney(Number(row.original.amount))}
                    </span>
                ),
            },
            {
                header: t("kassa.checkout_kind"),
                accessorKey: "checkout_kind",
                cell: ({ row }) =>
                    row.original.checkout_kind === "card" ?
                        t("kassa.card")
                    :   t("kassa.cash"),
            },
            {
                header: t("form.vehicle"),
                accessorKey: "vehicle_plate",
                cell: ({ row }) => row.original.vehicle_plate || "—",
            },
            {
                header: t("form.driver"),
                accessorKey: "driver_name",
                cell: ({ row }) => row.original.driver_name || "—",
            },
            {
                header: t("table.source"),
                accessorKey: "source",
                cell: ({ row }) => row.original.source || "—",
            },
            {
                header: t("table.responsible"),
                accessorKey: "executor_name",
                enableSorting: true,
            },
            {
                header: t("form.date"),
                accessorKey: "created",
                enableSorting: true,
                cell: ({ row }) => {
                    const d = new Date(row.original.created)
                    if (isNaN(d.getTime())) return "-"
                    return format(d, "dd/MM/yyyy HH:mm")
                },
            },
            {
                header: t("form.comment"),
                accessorKey: "comment",
                enableSorting: true,
            },
            {
                header: t("table.type"),
                accessorKey: "type",
                enableSorting: true,
                cell: ({ row }) => (
<TransactionTypeCell row={row} />
                ),
            },
        ],
        [t],
    )
}
