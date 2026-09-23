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
                header: t("form.currency"),
                accessorKey: "currency",
                cell: ({ getValue }) => {
                    const currencyValue = getValue<number>()

                    if (!currencyValue) {
                        return <span>—</span>
                    }

                    const currencyMap = {
                        1: "UZS - So'm",
                        2: "USD - AQSh dollari",
                    }

                    return (
                        <span>
                            {currencyMap[
                                currencyValue as keyof typeof currencyMap
                            ] || "—"}
                        </span>
                    )
                },
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

            {
                header: t("form.currency_rate"),
                accessorKey: "currency_course",
                cell: ({ getValue }) => {
                    const value = getValue<number | string>()

                    if (value === null || value === undefined || value === "") {
                        return <span className="text-muted-foreground">—</span>
                    }
                    const num =
                        typeof value === "string" ? parseFloat(value) : value
                    if (isNaN(num)) {
                        return (
                            <span className="">
                                {String(value)}
                            </span>
                        )
                    }
                    const formatted = num
                        .toLocaleString("uz-UZ", {
                            minimumFractionDigits: num < 1 ? 4 : 2,
                            maximumFractionDigits: 4,
                        })
                        .replace(/,/g, " ")

                    return <span className="">{formatted}</span>
                },
            },
        ],
        [t],
    )
}
