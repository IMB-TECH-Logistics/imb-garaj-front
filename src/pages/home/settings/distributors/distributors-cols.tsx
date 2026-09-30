import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useColumnsDistributorsTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<DistributorType>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.name"),
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="min-w-[200px]">{row.original.name || "-"}</div>
                ),
            },
            {
                accessorKey: "district_name",
                header: t("form.district"),
                enableSorting: false,
                cell: ({ row }) => row.original.district_name || "-",
            },
            {
                accessorKey: "code",
                header: t("form.code"),
                enableSorting: false,
                cell: ({ row }) => row.original.code || "-",
            },
        ],
        [t],
    )
}
