import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { formatPhoneNumber } from "../customers/phone-number"
import SortableHeader from "../../sortable-header"

/**
 * Column widths are explicit because `DataTable` renders with
 * `table-layout: fixed`: without a width the browser splits the row evenly and
 * the longer headers ("Guvohnoma raqami", "Ish staji") overlap each other
 * (UI audit S1-27). Header wording is kept identical to the labels in
 * `add-driver.tsx` so the table and the edit dialog name the same field the
 * same way (S1-34).
 *
 * SARALASH — SERVER TOMONDA (B-70, 5-raund). To'qqizala ustun ham backend
 * `users/drivers/` ning `ordering_fields` ida bor. Maydonlar bazada `User`
 * da emas, bog'langan `DriverProfile` da yotadi — backend ularni shu yerdagi
 * ustun nomi ostida taxalluslaydi, shuning uchun `field` aynan ustun
 * nomi bilan yoziladi (`driver.phone` emas, `phone_number`).
 *
 * Telefonning mijoz tomondagi `sortingFn` i olib tashlandi: u faqat joriy
 * sahifani tartiblardi va `accessorKey` bo'sh bo'lgani uchun aslida
 * hech nimani solishtirmasdi.
 */
export const useColumnsDriverTable = (
    onOpenTrips?: (driver: DriversType) => void,
) => {
    return useMemo<ColumnDef<DriversType>[]>(
        () => [
            {
                accessorKey: "first_name",
                header: () => (
                    <SortableHeader field="first_name" label="Ism" />
                ),
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
                header: () => (
                    <SortableHeader field="last_name" label="Familiya" />
                ),
                size: 125,
            },
            {
                accessorKey: "phone_number",
                header: () => (
                    <SortableHeader field="phone_number" label="Telefon" />
                ),
                size: 145,
                cell: ({ row }) => (
                    <div className="truncate">
                        {formatPhoneNumber(
                            row.original?.driver?.phone || "Mavjud emas",
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "username",
                header: () => (
                    <SortableHeader field="username" label="Login" />
                ),
                size: 105,
            },
            {
                header: () => (
                    <SortableHeader field="passport_number" label="Pasport raqami" />
                ),
                size: 140,
                accessorFn: (row) => row.driver?.passport_serial || "",
                cell: ({ row }) => {
                    return row.getValue("passport_number") || "-"
                },
                id: "passport_number",
            },
            {
                header: () => (
                    <SortableHeader field="pinfl" label="PINFL" />
                ),
                size: 135,
                accessorFn: (row) => row.driver?.pinfl || "",
                cell: ({ row }) => {
                    return row.getValue("pinfl") || "-"
                },
                id: "pinfl",
            },
            {
                header: () => (
                    <SortableHeader field="driver_license" label="Guvohnoma raqami" />
                ),
                size: 155,
                accessorFn: (row) => row.driver?.driver_license || "",
                cell: ({ row }) => {
                    return row.getValue("driver_license") || "-"
                },
                id: "driver_license",
            },
            {
                header: () => (
                    <SortableHeader field="work_experience" label="Ish staji" />
                ),
                size: 95,
                accessorFn: (row) => row.driver?.experience || 0,
                cell: ({ row }) => {
                    const value = row.getValue("work_experience")
                    return value ? `${value} yil` : "-"
                },
                id: "work_experience",
            },
            {
                header: () => (
                    <SortableHeader field="license_expiry" label="Guvohnoma muddati" />
                ),
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
