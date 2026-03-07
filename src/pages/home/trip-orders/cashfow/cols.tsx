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
                    const value = getValue<string>()
                    if (!value) return <span className="">—</span>

                    const num = Number(value)
                    if (isNaN(num)) return <span className="">{value}</span>

                    return (
                        <div className="min-w-[100px]">
                            {num.toLocaleString("uz-UZ").replace(/,/g, " ")}
                        </div>
                    )
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
