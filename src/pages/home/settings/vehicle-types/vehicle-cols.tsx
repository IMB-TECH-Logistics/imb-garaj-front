import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const vehicleTypeOptions = [
    { value: "model", label: "Avtomobil rusumi" },
    { value: "truck", label: "Avtomobil turi" },
    { value: "trailer", label: "Tirkama turi" },
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
                header: t("table.type"),
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
