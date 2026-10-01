import type { WhUnit } from "@/pages/home/ombor/types"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useColumnsUnitTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<WhUnit>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.name"),
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.name}</span>
                ),
            },
        ],
        [t],
    )
}
