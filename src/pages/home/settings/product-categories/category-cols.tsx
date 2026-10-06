import { Badge } from "@/components/ui/badge"
import type { WhCategory } from "@/pages/home/ombor/types"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useColumnsCategoryTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<WhCategory>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.name"),
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.name}</span>
                ),
            },
            {
                accessorKey: "unit_name",
                header: t("form.unit"),
            },
            {
                id: "is_serialized",
                header: t("wh.serialized"),
                cell: ({ row }) =>
                    row.original.is_serialized ?
                        <Badge>{t("wh.serialized_yes")}</Badge>
                    :   <span className="text-muted-foreground">—</span>,
            },
            {
                accessorKey: "products_count",
                header: t("wh.products"),
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original.products_count}
                    </span>
                ),
            },
        ],
        [t],
    )
}
