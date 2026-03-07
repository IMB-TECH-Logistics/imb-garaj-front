import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { formatPhoneNumber } from "../customers/phone-number"
export const useColumnsDriverTable = () => {
    return useMemo<ColumnDef<DriversType>[]>(
        () => [
            {
                accessorKey: "first_name",
                header: "Ism",
                enableSorting: true,
            },
            {
                accessorKey: "last_name",
                header: "Ism",
                enableSorting: true,
            },
            {
                accessorKey: "phone_number",
                header: "Telefon raqami",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="min-w-[180px] w-[220px] truncate">
                        {formatPhoneNumber(row.original?.driver?.phone || "Mavjud emas")}
                    </div>
                ),
                sortingFn: (rowA, rowB, columnId) => {
                    const phoneA = rowA.getValue(columnId) as string
                    const phoneB = rowB.getValue(columnId) as string
                    const digitsA = (phoneA || "").replace(/\D/g, "")
                    const digitsB = (phoneB || "").replace(/\D/g, "")
                    return digitsA.localeCompare(digitsB)
                },
            },
            {
                accessorKey: "username",
                header: "Login",
                enableSorting: true,
            },
            {
                header: "Passport seriyasi",
                enableSorting: true,
                accessorFn: (row) => row.driver?.passport_serial || "",
                cell: ({ row }) => {
                    return row.getValue("passport_number") || "-"
                },
                id: "passport_number",
            },
            {
                header: "JShShIR",
                enableSorting: true,
                accessorFn: (row) => row.driver?.pinfl || "",
                cell: ({ row }) => {
                    return row.getValue("pinfl") || "-"
                },
                id: "pinfl",
            },
            {
                header: "Haydovchilik guvohnomasi",
                enableSorting: true,
                accessorFn: (row) => row.driver?.driver_license || "",
                cell: ({ row }) => {
                    return row.getValue("driver_license") || "-"
                },
                id: "driver_license",
            },
            {
                header: "Ish staji",
                enableSorting: true,
                accessorFn: (row) => row.driver?.experience || 0,
                cell: ({ row }) => {
                    const value = row.getValue("work_experience")
                    return value ? `${value} yil` : "-"
                },
                id: "work_experience",
            },
            {
                header: "Litsenziya muddati",
                enableSorting: true,
                accessorFn: (row) => row.driver?.driver_license_date || "",
                cell: ({ row }) => {
                    const dateValue = row.getValue("license_expiry") as string
                    if (!dateValue) return "-"

                    const date = new Date(dateValue)
                    return date.toLocaleDateString("en-GB")
                },
                id: "license_expiry",
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
