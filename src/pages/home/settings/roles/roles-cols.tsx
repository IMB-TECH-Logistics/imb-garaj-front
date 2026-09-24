import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useColumnsRolesTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<RolesType>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.user_role"),
                enableSorting: true,
            },
            {
                id: "actions_count",
                header: t("form.action_type"),
                enableSorting: false,
                cell: ({ row }) => {
                    const count = row.original.actions?.length ?? 0
                    if (!count) {
                        return (
                            <span className="text-muted-foreground">
                                Ruxsat berilmagan
                            </span>
                        )
                    }
                    return (
                        <span className="tabular-nums font-medium">
                            {count} ta
                        </span>
                    )
                },
            },
        ],
        [t],
    )
}
