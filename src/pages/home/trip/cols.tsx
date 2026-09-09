import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import SortableHeader from "../sortable-header"

/**
 * SARALASH — SERVER TOMONDA (B-72, 5-raund).
 *
 * `enableSorting: true` faqat ko'rinib turgan 25 qatorni tartiblardi:
 * 185 aylanma ichida "Buyurtmalar soni" kamayish tartibida ekranda 27
 * ko'rinardi, haqiqiy maksimum esa 29 edi. Endi sarlavha `?ordering=` ni
 * URL'ga yozadi va backend butun to'plamni tartiblaydi
 * (`trips/` → ordering_fields: start, end, driver_name, vehicle_number,
 * orders_count va h.k.).
 */
export const useCostCols = () => {
    return useMemo<ColumnDef<TripRow>[]>(
        () => [
            {
                header: () => (
                    <SortableHeader field="vehicle_number" label="Mashina" />
                ),
                accessorKey: "vehicle_number",
                cell: ({ row }) => <span>{row.original.vehicle_number}</span>,
            },
            {
                header: () => (
                    <SortableHeader field="driver_name" label="Haydovchi" />
                ),
                accessorKey: "driver_name",
                cell: ({ row }) => <span>{row.original.driver_name}</span>,
            },
            {
                header: () => (
                    <SortableHeader field="start" label="Boshlangan sana" />
                ),
                accessorKey: "start",
                cell: ({ row }) => <span>{row.original.start}</span>,
            },
            {
                header: () => (
                    <SortableHeader field="end" label="Tugash sanasi" />
                ),
                accessorKey: "end",
                cell: ({ row }) => <span>{row.original.end}</span>,
            },
            {
                header: () => (
                    <SortableHeader field="orders_count" label="Buyurtmalar soni" />
                ),
                accessorKey: "orders_count",
                cell: ({ row }) => <span>{row.original.orders_count}</span>,
            },
        ],
        [],
    )
}
