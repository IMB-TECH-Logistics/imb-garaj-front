import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useColumnsCargoTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<RolesType>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.cargo_type"),
                enableSorting: true,
            },
        ],
        [t],
    )
}
