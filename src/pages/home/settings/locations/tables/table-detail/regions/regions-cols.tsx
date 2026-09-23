import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useColumnsRegionsTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<RegionsType>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.region"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="">
                        {row.original.name || "-"}
                    </div>
                ),
            },
        ],
        [t],
    )
}
