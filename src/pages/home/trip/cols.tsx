import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useCostCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<TripRow>[]>(
        () => [
            {
                header: t("form.truck"),
                accessorKey: "vehicle_number",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.vehicle_number}</span>,
            },
            {
                header: t("form.driver"),
                accessorKey: "driver_name",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.driver_name}</span>,
            },
            {
                header: t("form.start_date"),
                accessorKey: "start",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.start}</span>,
            },
            {
                header: t("form.end_date"),
                accessorKey: "end",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.end}</span>,
            },
            {
                header: t("table.orders_count"),
                accessorKey: "order_count",
                enableSorting: true,
                cell: ({ row }) => (
                    <span>{Number(row.original.order_count ?? 0)}</span>
                ),
            },
        ],
        [t],
    )
}
