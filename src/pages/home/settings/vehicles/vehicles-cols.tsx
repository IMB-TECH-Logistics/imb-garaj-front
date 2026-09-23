import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format-date"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const FUEL_LABELS: Record<string, string> = {
    methane: "Metan",
    diesel: "Dizel",
}

const STATUS_COLORS: Record<number, string> = {
    1: "bg-green-500/10 text-green-600 border-transparent",
    2: "bg-gray-500/10 text-gray-500 border-transparent",
    3: "bg-orange-500/10 text-orange-600 border-transparent",
}

export const useColumnsVehiclesTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<VehicleDetailType>[]>(
        () => {
            const statusLabels: Record<number, string> = {
                1: t("table.status_loaded"),
                2: t("table.status_empty"),
                3: t("table.status_repair"),
            }
            return [
            {
                accessorKey: "truck_number",
                header: t("form.vehicle_number"),
                enableSorting: true,
            },
            {
                accessorKey: "owner_name",
                header: t("form.owner"),
                enableSorting: true,
            },
            {
                accessorKey: "trailer_number",
                header: t("form.trailer_number"),
                enableSorting: true,
                cell: ({ row }) => row.original.trailer_number || "-",
            },
            {
                accessorKey: "truck_type_name",
                header: t("form.vehicle_type"),
                enableSorting: true,
                cell: ({ row }) => row.original.truck_type_name || "-",
            },
            {
                accessorKey: "driver_name",
                header: t("form.driver"),
                enableSorting: true,
                cell: ({ row }) => row.original.driver_name || "-",
            },
            {
                accessorKey: "fuel",
                header: t("form.fuel_type"),
                enableSorting: true,
                cell: ({ row }) => FUEL_LABELS[row.original.fuel] || "-",
            },
            {
                accessorKey: "status",
                header: t("table.status"),
                enableSorting: true,
                cell: ({ row }) => {
                    const status = row.original.status
                    return (
                        <Badge
                            variant="outline"
                            className={STATUS_COLORS[status] || ""}
                        >
                            {statusLabels[status] || "-"}
                        </Badge>
                    )
                },
            },
            {
                accessorKey: "year",
                header: t("form.year"),
                enableSorting: true,
                cell: ({ row }) => row.original.year || "-",
            },
            {
                accessorKey: "consumption",
                header: t("table.fuel_consumption_col"),
                enableSorting: true,
                cell: ({ row }) => row.original.consumption || "-",
            },
            {
                accessorKey: "registered_date",
                header: t("form.registration_date"),
                enableSorting: true,
                cell: ({ row }) =>
                    row.original.registered_date ?
                        formatDate(row.original.registered_date)
                    :   "-",
            },
            ]
        },
        [t],
    )
}
