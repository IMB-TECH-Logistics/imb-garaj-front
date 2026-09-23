import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useCostCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<any>[]>(
        () => [
            {
                header: t("form.amount"),
                accessorKey: "amount",
                cell: ({ getValue }) => {
                    const v = Number(getValue<string>() ?? 0) || 0
                    return <span>{formatMoney(v)}</span>
                },
            },
            {
                header: t("table.responsible"),
                accessorKey: "owner",
                cell: ({ getValue }) => <span>{getValue<string>() || "—"}</span>,
            },
            {
                header: t("form.date"),
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
            {
                header: t("form.comment"),
                accessorKey: "desc",
                cell: ({ getValue }) => <span>{getValue<string>() || "—"}</span>,
            },
        ],
        [t],
    )
}


