import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useColumnsOrderPayment = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<OrderPaymentType>[]>(
        () => [
            {
                header: t("form.payment_type"),
                accessorKey: "payment_type_name",
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
