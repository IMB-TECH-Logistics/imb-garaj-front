import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import SortableHeader from "../../sortable-header"
import { formatPhoneNumber } from "./phone-number"

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
export const useColumnsCustomersTable = () => {
    return useMemo<ColumnDef<CustomersType>[]>(
        () => [
            {
                accessorKey: "code",
                header: () => (
                    <SortableHeader field="code" label="Firma kodi" />
                ),
                size: 80,
                cell: ({ row }) => (
                    <span>{row.original.code || "—"}</span>
                ),
            },
            {
                accessorKey: "name",
                header: () => (
                    <SortableHeader field="name" label="Firma nomi" />
                ),
                cell: ({ row }) => (
                    <div className="min-w-[180px] w-[220px] truncate">
                        {row.original.name || "-"}
                    </div>
                ),
            },
            {
                accessorKey: "phone_number",
                header: () => (
                    <SortableHeader field="phone_number" label="Telefon raqami" />
                ),
                cell: ({ row }) => (
                    <div className="min-w-[180px] w-[220px] truncate">
                        {formatPhoneNumber(row.original.phone_number)}
                    </div>
                ),
            },
            {
                accessorKey: "nds_percent",
                header: () => (
                    <SortableHeader field="nds_percent" label="NDS (%)" />
                ),
                cell: ({ row }) => (
                    <span>{row.original.nds_percent ?? "—"} %</span>
                ),
            },
        ],
        [],
    )
}
