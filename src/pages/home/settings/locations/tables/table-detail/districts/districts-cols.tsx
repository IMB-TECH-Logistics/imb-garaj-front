import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const  useColumnDestricts = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<SettingsDistrictType>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.name"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="truncate">
                        {row.original.name || "-"}
                    </div>
                ),
            },
        ],
        [t],
    )
}
