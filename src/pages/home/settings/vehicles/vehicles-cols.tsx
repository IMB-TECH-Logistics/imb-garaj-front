import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format-date"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import SortableHeader from "../../sortable-header"

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

/**
 * SARALASH — SERVER TOMONDA (B-70/B-71, 5-raund).
 *
 * `enableSorting: true` DataTable'ning mijoz tomon saralashini yoqardi — u
 * faqat ko'rinib turgan 25 qatorni tartiblaydi, ya'ni "eng katta"/"eng
 * kichik" savoliga sahifa bo'yicha javob berardi va buni foydalanuvchi
 * butun to'plamning javobi deb o'qirdi. Endi sarlavha `SortableHeader` —
 * `?ordering=` URL'ga yoziladi, `index.tsx` uni so'rovga qo'shadi va
 * backend butun to'plamni tartiblaydi.
 *
 * `enableSorting` ATAYLAB berilmaydi: aks holda DataTable ustiga yana o'z
 * strelkasini va o'z saralashini qo'shadi.
 */
export const useColumnsVehiclesTable = () => {
    return useMemo<ColumnDef<VehicleDetailType>[]>(
        () => [
            {
                accessorKey: "truck_number",
                header: () => (
                    <SortableHeader field="truck_number" label="Avtomobil raqami" />
                ),
            },
            {
                accessorKey: "owner_name",
                header: () => (
                    <SortableHeader field="owner_name" label="Egasi" />
                ),
            },
            {
                accessorKey: "trailer_number",
                header: () => (
                    <SortableHeader field="trailer_number" label="Tirkama raqami" />
                ),
                cell: ({ row }) => row.original.trailer_number || "-",
            },
            {
                accessorKey: "truck_type_name",
                header: () => (
                    <SortableHeader field="truck_type_name" label="Avtomobil turi" />
                ),
                cell: ({ row }) => row.original.truck_type_name || "-",
            },
            {
                accessorKey: "driver_name",
                header: () => (
                    <SortableHeader field="driver_name" label="Haydovchi" />
                ),
                cell: ({ row }) => row.original.driver_name || "-",
            },
            {
                accessorKey: "fuel",
                header: () => (
                    <SortableHeader field="fuel" label="Yoqilg'i turi" />
                ),
                cell: ({ row }) => FUEL_LABELS[row.original.fuel] || "-",
            },
            {
                accessorKey: "status",
                header: () => (
                    <SortableHeader field="status" label="Status" />
                ),
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
                header: () => (
                    <SortableHeader field="year" label="Yili" />
                ),
                cell: ({ row }) => row.original.year || "-",
            },
            {
                accessorKey: "consumption",
                header: () => (
                    <SortableHeader field="consumption" label="Sarfi" />
                ),
                cell: ({ row }) => row.original.consumption || "-",
            },
            {
                accessorKey: "registered_date",
                header: () => (
                    <SortableHeader field="registered_date" label="Ro'yxatdan o'tgan sana" />
                ),
                cell: ({ row }) =>
                    row.original.registered_date ?
                        formatDate(row.original.registered_date)
                    :   "-",
            },
        ],
        [],
    )
}
