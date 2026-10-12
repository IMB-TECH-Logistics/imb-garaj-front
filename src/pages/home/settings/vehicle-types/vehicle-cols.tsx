import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const VEHICLE_TYPE_KEYS: Record<string, string> = {
    model: "settings.vehicle_types.type_model",
    truck: "form.vehicle_type",
    trailer: "form.trailer_type",
}
export const useColumnsVehicleTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<VehicleRoleType>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.name"),
                enableSorting: true,
            },
            {
                accessorKey: "type",
                header: t("table.type"),
                enableSorting: true,
                cell: ({ row }) => {
                    const typeValue = row.getValue("type")

                    const labelKey = VEHICLE_TYPE_KEYS[String(typeValue)]

                    return labelKey ? t(labelKey) : typeValue
                },
            },
        ],
        [t],
    )
}
