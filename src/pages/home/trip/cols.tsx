import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

export const useCostCols = () => {
    return useMemo<ColumnDef<TripRow>[]>(
        () => [
            {
                header: "Mashina",
                accessorKey: "vehicle_number",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.vehicle_number}</span>,
            },
            {
                header: "Haydovchi",
                accessorKey: "driver_name",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.driver_name}</span>,
            },
            {
                header: "Boshlangan sana",
                accessorKey: "start",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.start}</span>,
            },
            {
                header: "Tugash sanasi",
                accessorKey: "end",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.end}</span>,
            },
            {
                header: "Buyurtmalar soni",
                accessorKey: "orders_count",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.orders_count}</span>,
            },
        ],
        [],
    )
}
