import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useCostCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<CashflowRow>[]>(
        () => [
            {
                header: t("table.action"),
                accessorKey: "action",
                enableSorting: true,
                cell: ({ getValue }) => {
                    const value = getValue<number>()
                    return (
                        <span>
                            {value === 1 ?
                                t("table.action_d2m")
                            : value === 2 ?
                                t("table.action_m2d")
                            :   "—"}
                        </span>
                    )
                },
            },
            {
                header: t("table.amount"),
                accessorKey: "amount",
                cell: ({ getValue }) => {
                    const v = Number(getValue<string>() ?? 0) || 0
                    return <span>{formatMoney(v)}</span>
                },
            },
            {
                header: t("form.payment_type"),
                accessorKey: "payment_type_name",
                enableSorting: true,
            },

            {
                header: t("table.category"),
                accessorKey: "category_name",
                cell: ({ getValue }) => <span>{getValue<number>()}</span>,
            },
            {
                header: t("form.comment"),
                accessorKey: "comment",
                cell: ({ getValue }) => (
                    <span className=" ">{getValue<string>() || "—"}</span>
                ),
            },

            {
                header: t("table.created_at"),
                accessorKey: "created",
                enableSorting: true,
                cell: ({ getValue }) => (
                    <span>
                        {getValue<string>() ?
                            format(
                                new Date(getValue<string>()),
                                "dd.MM.yyyy HH:mm",
                            )
                        :   "—"}
                    </span>
                ),
            },
        ],
        [t],
    )
}
