import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import SortableHeader from "../../sortable-header"

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
export const useColumnsRolesTable = () => {
    return useMemo<ColumnDef<RolesType>[]>(
        () => [
            {
                accessorKey: "name",
                header: () => (
                    <SortableHeader field="name" label="Rol turi" />
                ),
            },
        ],
        [],
    )
}
