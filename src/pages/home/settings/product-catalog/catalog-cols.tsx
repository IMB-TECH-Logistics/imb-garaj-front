import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/format-money"
import type { WhProduct } from "@/pages/home/ombor/types"
import { LifeText } from "@/pages/home/ombor/life-text"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useColumnsCatalogTable = (
    onSerialize?: (product: WhProduct) => void,
) => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<WhProduct>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.name"),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{row.original.name}</span>
                        {row.original.is_serialized && (
                            <Badge>{t("wh.serialized_yes")}</Badge>
                        )}
                    </div>
                ),
            },
            {
                id: "min_quantity",
                header: t("wh.min_quantity"),
                cell: ({ row }) =>
                    row.original.min_quantity === null ?
                        <span className="text-muted-foreground">—</span>
                    :   <span className="tabular-nums whitespace-nowrap">
                            {formatNumber(row.original.min_quantity)}{" "}
                            {row.original.unit_name}
                        </span>,
            },
            {
                id: "life",
                header: t("wh.life"),
                cell: ({ row }) => <LifeText product={row.original} />,
            },
            ...(onSerialize ?
                [
                    {
                        id: "serialize",
                        header: "",
                        cell: ({ row }) =>
                            row.original.is_serialized ? null : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onSerialize(row.original)
                                    }}
                                >
                                    {t("wh.serialize")}
                                </Button>
                            ),
                    } satisfies ColumnDef<WhProduct>,
                ]
            :   []),
        ],
        [t, onSerialize],
    )
}
