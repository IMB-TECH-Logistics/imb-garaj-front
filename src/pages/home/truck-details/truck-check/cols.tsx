import { formatMoney } from "@/lib/format-money"
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
                    const v = Number(getValue<string>() ?? 0) || 0
                    return <span>{formatMoney(v)}</span>
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
