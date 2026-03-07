import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

export const useColumnsUsersTable = () => {
    return useMemo<ColumnDef<UserType>[]>(
        () => [
            {
                accessorKey: "first_name",
                header: "Ism",
                enableSorting: true,
            },
            {
                accessorKey: "last_name",
                header: "Familiya",
                enableSorting: true,
            },
            {
                accessorKey: "username",
                header: "Login",
                enableSorting: true,
            },
            {
                accessorKey: "role_name",
                header: "Foydalanuvchi roli",
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
        [],
    )
}
