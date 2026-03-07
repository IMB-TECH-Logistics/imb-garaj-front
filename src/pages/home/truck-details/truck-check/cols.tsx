import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"

export const useTechnicInspect = () => {
    return useMemo<ColumnDef<TechnicInspect>[]>(
        () => [
            {
                header: "Avtomobil",
                accessorKey: "vehicle_name",
                enableSorting: true,
            },
            {
                header: "Kategoriya",
                accessorKey: "category_name",
                enableSorting: true,
            },
            {
                header: "Davomiyligi",
                accessorKey: "lifespan",
                enableSorting: true,
            },
            {
                header: "Sana",
                accessorKey: "date",
                enableSorting: true,
                cell: ({ row }) => (
                    <span>{format(row.original.date, "yyyy-MM-dd")}</span>
                ),
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
                header: "Izoh",
                accessorKey: "comment",
                enableSorting: true,
            },
        ],
        [],
    )
}
