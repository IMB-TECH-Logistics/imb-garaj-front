import { formatMoney } from "@/lib/format-money"
import type { WhProduct } from "@/pages/home/ombor/types"
import { LifeText } from "@/pages/home/ombor/life-text"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useColumnsCatalogTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<WhProduct>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.name"),
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.name}</span>
                ),
            },
            {
                id: "min_quantity",
                header: t("wh.min_quantity"),
                cell: ({ row }) =>
                    row.original.min_quantity === null ?
                        <span className="text-muted-foreground">—</span>
                    :   <span className="tabular-nums whitespace-nowrap">
                            {formatMoney(row.original.min_quantity)}{" "}
                            {row.original.unit_name}
                        </span>,
            },
            {
                id: "life",
                header: t("wh.life"),
                cell: ({ row }) => <LifeText product={row.original} />,
            },
            {
                accessorKey: "gtin",
                header: "GTIN",
                cell: ({ row }) =>
                    row.original.gtin ?
                        <span className="font-mono text-xs text-muted-foreground">
                            {row.original.gtin}
                        </span>
                    :   <span className="text-muted-foreground">—</span>,
            },
        ],
        [t],
    )
}
