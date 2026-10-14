import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format-date"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const FUEL_KEYS: Record<string, string> = {
    methane: "settings.vehicles.fuel_methane",
    diesel: "settings.vehicles.fuel_diesel",
}

const STATUS_COLORS: Record<number, string> = {
    1: "bg-green-500/10 text-green-600 border-transparent",
    2: "bg-gray-500/10 text-gray-500 border-transparent",
    3: "bg-orange-500/10 text-orange-600 border-transparent",
}

const DriverCell = ({ name }: { name: string | null }) => (
    <span className="block truncate whitespace-nowrap" title={name || undefined}>
        {name || "-"}
    </span>
)

const StatusCell = ({ status }: { status: number }) => {
    const { t } = useTranslation()
    const labels: Record<number, string> = {
        1: t("table.status_loaded"),
        2: t("table.status_empty"),
        3: t("table.status_repair"),
    }
    return (
        <Badge variant="outline" className={STATUS_COLORS[status] || ""}>
            {labels[status] || "-"}
        </Badge>
    )
}

export const useColumnsVehiclesTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<VehicleDetailType>[]>(
        () => [
            {
                accessorKey: "truck_number",
                header: t("form.vehicle_number"),
                enableSorting: true,
            },
            {
                accessorKey: "truck_model_name",
                header: t("form.truck_model"),
                enableSorting: true,
                cell: ({ row }) => row.original.truck_model_name || "-",
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
                size: 200,
                cell: ({ row }) => <DriverCell name={row.original.driver_name} />,
            },
            {
                accessorKey: "fuel",
                header: t("form.fuel_type"),
                enableSorting: true,
                cell: ({ row }) =>
                    FUEL_KEYS[row.original.fuel] ?
                        t(FUEL_KEYS[row.original.fuel])
                    :   "-",
            },
            {
                accessorKey: "status",
                header: t("table.status"),
                enableSorting: true,
                cell: ({ row }) => <StatusCell status={row.original.status} />,
            },
            {
                accessorKey: "year",
                header: t("form.year"),
                enableSorting: true,
                cell: ({ row }) => row.original.year || "-",
            },
            {
                accessorKey: "consumption",
                header: `${t("table.fuel_consumption_col")} (${t("settings.vehicles.per_100km")})`,
                enableSorting: true,
                cell: ({ row }) => {
                    const value = row.original.consumption
                    if (value === null || value === undefined) return "-"
                    const unit =
                        row.original.fuel === "diesel" ?
                            t("settings.vehicles.unit_l")
                        :   t("settings.petrol.unit_m3")
                    return `${Number(value)} ${unit}`
                },
            },
            {
                accessorKey: "owner_name",
                header: t("form.owner"),
                enableSorting: true,
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
        ],
        [t],
    )
}

export const useColumnsTrailersTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<VehicleDetailType>[]>(
        () => [
            {
                accessorKey: "trailer_number",
                header: t("form.trailer_number"),
                enableSorting: true,
            },
            {
                accessorKey: "trailer_type_name",
                header: t("form.trailer_type"),
                enableSorting: true,
                cell: ({ row }) => row.original.trailer_type_name || "-",
            },
            {
                accessorKey: "driver_name",
                header: t("form.driver"),
                enableSorting: true,
                size: 200,
                cell: ({ row }) => <DriverCell name={row.original.driver_name} />,
            },
            {
                accessorKey: "status",
                header: t("table.status"),
                enableSorting: true,
                cell: ({ row }) => <StatusCell status={row.original.status} />,
            },
            {
                accessorKey: "owner_name",
                header: t("form.owner"),
                enableSorting: true,
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
        ],
        [t],
    )
}
