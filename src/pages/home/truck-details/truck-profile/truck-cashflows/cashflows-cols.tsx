import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useColumnsCashflowsTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<VehicleCashflowsType>[]>(
        () => [
            {
                accessorKey: "vehicle_number",
                header: t("form.truck_number"),
                enableSorting: true,
            },
            {
                accessorKey: "category_name",
                header: t("form.expense_type"),
                enableSorting: true,
            },
            {
                accessorKey: "comment",
                header: t("form.comment"),
                enableSorting: true,
            },
               {
                header: t("table.amount"),
                accessorKey: "amount",
                cell: ({ getValue }) => {
                    const value = getValue<string>()
                    if (!value) return <span className="">—</span>

                    const num = Number(value)
                    if (isNaN(num)) return <span className="">{value}</span>

                    return (
                        <span className="">
                            {num.toLocaleString("uz-UZ").replace(/,/g, " ")}
                        </span>
                    )
                },
            },
        ],
        [t],
    )
}
