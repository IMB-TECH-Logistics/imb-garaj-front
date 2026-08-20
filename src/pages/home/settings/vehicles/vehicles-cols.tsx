import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format-date"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

const FUEL_LABELS: Record<string, string> = {
    methane: "Metan",
    diesel: "Dizel",
}

const STATUS_LABELS: Record<number, string> = {
    1: "Yukli",
    2: "Yuksiz",
    3: "Ta'mirda",
}

const STATUS_COLORS: Record<number, string> = {
    1: "bg-green-500/10 text-green-600 border-transparent",
    2: "bg-gray-500/10 text-gray-500 border-transparent",
    3: "bg-orange-500/10 text-orange-600 border-transparent",
}

export const useColumnsVehiclesTable = () => {
    return useMemo<ColumnDef<VehicleDetailType>[]>(
        () => [
            {
                accessorKey: "truck_number",
                header: "Avtomobil raqami",
                enableSorting: true,
            },
            {
                accessorKey: "owner_name",
                header: "Egasi",
                enableSorting: true,
            },
            {
                accessorKey: "trailer_number",
                header: "Tirkama raqami",
                enableSorting: true,
                cell: ({ row }) => row.original.trailer_number || "-",
            },
            {
                accessorKey: "truck_type_name",
                header: "Avtomobil turi",
                enableSorting: true,
                cell: ({ row }) => row.original.truck_type_name || "-",
            },
            {
                accessorKey: "driver_name",
                header: "Haydovchi",
                enableSorting: true,
                cell: ({ row }) => row.original.driver_name || "-",
            },
            {
                accessorKey: "fuel",
                header: "Yoqilg'i turi",
                enableSorting: true,
                cell: ({ row }) => FUEL_LABELS[row.original.fuel] || "-",
            },
            {
                accessorKey: "status",
                header: "Status",
                enableSorting: true,
                cell: ({ row }) => {
                    const status = row.original.status
                    return (
                        <Badge
                            variant="outline"
                            className={STATUS_COLORS[status] || ""}
                        >
                            {STATUS_LABELS[status] || "-"}
                        </Badge>
                    )
                },
            },
            {
                accessorKey: "year",
                header: "Yili",
                enableSorting: true,
                cell: ({ row }) => row.original.year || "-",
            },
            {
                accessorKey: "consumption",
                header: "Sarfi",
                enableSorting: true,
                cell: ({ row }) => row.original.consumption || "-",
            },
            {
                accessorKey: "registered_date",
                header: "Ro'yxatdan o'tgan sana",
                enableSorting: true,
                cell: ({ row }) =>
                    row.original.registered_date ?
                        formatDate(row.original.registered_date)
                    :   "-",
            },
        ],
        [],
    )
}
