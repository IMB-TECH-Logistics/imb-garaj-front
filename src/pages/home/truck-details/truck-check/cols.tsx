import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useTechnicInspect = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<TechnicInspect>[]>(
        () => [
            {
                header: t("form.truck"),
                accessorKey: "vehicle_name",
                enableSorting: true,
            },
            {
                header: t("table.category"),
                accessorKey: "category_name",
                enableSorting: true,
            },
            {
                header: t("table.duration"),
                accessorKey: "lifespan",
                enableSorting: true,
            },
            {
                header: t("form.date"),
                accessorKey: "date",
                enableSorting: true,
                cell: ({ row }) => (
                    <span>{format(row.original.date, "yyyy-MM-dd")}</span>
                ),
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
                header: t("form.comment"),
                accessorKey: "comment",
                enableSorting: true,
            },
        ],
        [t],
    )
}
