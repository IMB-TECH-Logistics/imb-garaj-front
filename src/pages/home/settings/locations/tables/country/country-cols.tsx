import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useColumnsCountriesTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<RolesType>[]>(
        () => [
            {
                header: "№",
            },
            {
                header: t("form.country"),
            },
        ],
        [t],
    )
}
