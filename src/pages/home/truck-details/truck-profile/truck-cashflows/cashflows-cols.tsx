import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

export const useColumnsCashflowsTable = () => {
    return useMemo<ColumnDef<VehicleCashflowsType>[]>(
        () => [
            {
                accessorKey: "vehicle_number",
                header: "Avtomobil raqami",
                enableSorting: true,
            },
            {
                accessorKey: "category_name",
                header: "Xarajat turi",
                enableSorting: true,
            },
            {
                accessorKey: "comment",
                header: "Eslatmalar",
                enableSorting: true,
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
                        <span className="">
                            {num.toLocaleString("uz-UZ").replace(/,/g, " ")}
                        </span>
                    )
                },
            },
        ],
        [],
    )
}
