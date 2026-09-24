import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const vehicleTypeOptions = [
    { value: "truck", label: "Avtomobil" },
    { value: "trailer", label: "Tirkama" },
]
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
                header: t("form.vehicle_type"),
                enableSorting: true,
                cell: ({ row }) => {
                    const typeValue = row.getValue("type")

                    const vehicleType = vehicleTypeOptions.find(
                        (option) => option.value === typeValue,
                    )

                    return vehicleType ? vehicleType.label : typeValue
                },
            },
        ],
        [t],
    )
}
