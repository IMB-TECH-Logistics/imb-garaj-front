import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { formatPhoneNumber } from "../customers/phone-number"

/**
 * Column widths are explicit because `DataTable` renders with
 * `table-layout: fixed`: without a width the browser splits the row evenly and
 * the longer headers ("Guvohnoma raqami", "Ish staji") overlap each other
 * (UI audit S1-27). Header wording is kept identical to the labels in
 * `add-driver.tsx` so the table and the edit dialog name the same field the
 * same way (S1-34).
 */
export const useColumnsDriverTable = (
    onOpenTrips?: (driver: DriversType) => void,
) => {
    return useMemo<ColumnDef<DriversType>[]>(
        () => [
            {
                accessorKey: "first_name",
                header: "Ism",
                enableSorting: true,
                size: 115,
                cell: ({ row }) =>
                    onOpenTrips ? (
                        // The row used to be clickable as a whole, which threw
                        // the user out of Sozlamalar with no warning (S1-33).
                        // Only this cell navigates now, and it looks like a link.
                        <button
                            type="button"
                            className="text-primary underline-offset-2 hover:underline text-left truncate w-full"
                            title="Haydovchining aylanmalarini ochish"
                            onClick={(e) => {
                                e.stopPropagation()
                                onOpenTrips(row.original)
                            }}
                        >
                            {row.original.first_name || "-"}
                        </button>
                    ) : (
                        <span className="truncate">
                            {row.original.first_name || "-"}
                        </span>
                    ),
            },
            {
                accessorKey: "last_name",
                header: "Familiya",
                enableSorting: true,
                size: 125,
            },
            {
                accessorKey: "phone_number",
                header: "Telefon",
                enableSorting: true,
                size: 145,
                cell: ({ row }) => (
                    <div className="truncate">
                        {formatPhoneNumber(
                            row.original?.driver?.phone || "Mavjud emas",
                        )}
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
                size: 105,
            },
            {
                header: "Pasport raqami",
                enableSorting: true,
                size: 140,
                accessorFn: (row) => row.driver?.passport_serial || "",
                cell: ({ row }) => {
                    return row.getValue("passport_number") || "-"
                },
                id: "passport_number",
            },
            {
                header: "PINFL",
                enableSorting: true,
                size: 135,
                accessorFn: (row) => row.driver?.pinfl || "",
                cell: ({ row }) => {
                    return row.getValue("pinfl") || "-"
                },
                id: "pinfl",
            },
            {
                header: "Guvohnoma raqami",
                enableSorting: true,
                size: 155,
                accessorFn: (row) => row.driver?.driver_license || "",
                cell: ({ row }) => {
                    return row.getValue("driver_license") || "-"
                },
                id: "driver_license",
            },
            {
                header: "Ish staji",
                enableSorting: true,
                size: 95,
                accessorFn: (row) => row.driver?.experience || 0,
                cell: ({ row }) => {
                    const value = row.getValue("work_experience")
                    return value ? `${value} yil` : "-"
                },
                id: "work_experience",
            },
            {
                header: "Guvohnoma muddati",
                enableSorting: true,
                size: 160,
                accessorFn: (row) => row.driver?.driver_license_date || "",
                cell: ({ row }) => {
                    const dateValue = row.getValue("license_expiry") as string
                    if (!dateValue) return "-"

                    const date = new Date(dateValue)
                    return date.toLocaleDateString("en-GB")
                },
                id: "license_expiry",
            },
        ],
        [onOpenTrips],
    )
}
