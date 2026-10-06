import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useColumnsRegionsTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<RegionsType>[]>(
        () => [
            {
                accessorKey: "viloyat_name",
                header: t("form.region"),
                enableSorting: true,
                cell: ({ row }) =>
                    row.original.parent ?
                        <div>{row.original.parent_name || "-"}</div>
                    :   <div className="font-bold">
                            {row.original.name || "-"}
                        </div>,
            },
            {
                accessorKey: "name",
                header: t("form.place"),
                enableSorting: false,
                cell: ({ row }) =>
                    row.original.parent ?
                        <div>{row.original.name || "-"}</div>
                    :   <div className="text-muted-foreground">—</div>,
            },
        ],
        [t],
    )
}
