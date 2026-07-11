import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"

export const useCostCols = () => {
    return useMemo<ColumnDef<CashflowRow>[]>(
        () => [
            {
                header: "Amal",
                accessorKey: "action",
                enableSorting: true,
                cell: ({ getValue }) => {
                    const value = getValue<number>()

                    return (
                        <span>
                            {value === 1 ?
                                "Haydovchidan Menejerga (D2M)"
                            : value === 2 ?
                                "Menejerdan Haydovchiga (M2D)"
                            :   "—"}
                        </span>
                    )
                },
            },
            {
                header: "Miqdor",
                accessorKey: "amount",
                cell: ({ getValue }) => {
                    const v = Number(getValue<string>() ?? 0) || 0
                    return <span>{formatMoney(v)}</span>
                },
            },
            {
                header: "To'lov turi",
                accessorKey: "payment_type_name",
                enableSorting: true,
            },

            {
                header: "Kategoriya",
                accessorKey: "category_name",
                cell: ({ getValue }) => <span>{getValue<number>()}</span>,
            },
            {
                header: "Izoh",
                accessorKey: "comment",
                cell: ({ getValue }) => (
                    <span className=" ">{getValue<string>() || "—"}</span>
                ),
            },

            {
                header: "Yaratilgan sana",
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
        [],
    )
}
