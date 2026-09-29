import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useColumnsCustomersTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<CustomersType>[]>(
        () => [
            {
                accessorKey: "code",
                header: t("form.company_code"),
                size: 80,
                enableSorting: true,
                cell: ({ row }) => (
                    <span>{row.original.code || "—"}</span>
                ),
            },
            {
                accessorKey: "name",
                header: t("form.company_name"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="min-w-[180px] w-[220px] truncate">
                        {row.original.name || "-"}
                    </div>
                ),
            },
        ],
        [t],
    )
}
