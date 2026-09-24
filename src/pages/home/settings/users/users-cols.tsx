import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useColumnsUsersTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<UserType>[]>(
        () => [
            {
                accessorKey: "first_name",
                header: t("form.first_name"),
                enableSorting: true,
            },
            {
                accessorKey: "last_name",
                header: t("form.last_name"),
                enableSorting: true,
            },
            {
                accessorKey: "username",
                header: t("auth.username"),
                enableSorting: true,
            },
            {
                accessorKey: "role_name",
                header: t("form.user_role"),
                enableSorting: true,
            },

            // {
            //     accessorKey: "is_active",
            //     header: "Aktiv",
            //     enableSorting: true,
            //     cell: ({ row }) => {
            //         const isActive = row.getValue("is_active")
            //         return isActive ? "Aktiv" : "Aktiv emas"
            //     },
            // },
 
        ],
        [t],
    )
}
