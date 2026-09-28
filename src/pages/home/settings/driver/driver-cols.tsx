import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { formatPhoneNumber } from "../customers/phone-number"
import { useTranslation } from "react-i18next"
import { formatExperience } from "@/lib/format-experience"
import { formatDriverLicense, formatPassportSerial } from "@/lib/format-driver-docs"
export const useColumnsDriverTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<DriversType>[]>(
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
                accessorKey: "phone_number",
                header: t("form.phone"),
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="min-w-[180px] w-[220px] truncate">
                        {formatPhoneNumber(row.original?.driver?.phone || "Mavjud emas")}
                    </div>
                ),
            },
            {
                header: t("form.passport"),
                enableSorting: false,
                accessorFn: (row) => formatPassportSerial(row.driver?.passport_serial),
                cell: ({ row }) => {
                    return row.getValue("passport_number") || "-"
                },
                id: "passport_number",
            },
            {
                header: t("form.jshshir"),
                enableSorting: false,
                accessorFn: (row) => row.driver?.pinfl || "",
                cell: ({ row }) => {
                    return row.getValue("pinfl") || "-"
                },
                id: "pinfl",
            },
            {
                header: t("form.license_number"),
                enableSorting: false,
                accessorFn: (row) => formatDriverLicense(row.driver?.driver_license),
                cell: ({ row }) => {
                    return row.getValue("driver_license") || "-"
                },
                id: "driver_license",
            },
            {
                header: t("form.work_experience"),
                enableSorting: false,
                accessorFn: (row) =>
                    formatExperience(
                        t,
                        row.driver?.experience_months,
                        row.driver?.experience,
                    ),
                cell: ({ row }) => row.getValue("work_experience") as string,
                id: "work_experience",
            },
            {
                header: t("form.license_expiry"),
                enableSorting: false,
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
        [t],
    )
}
