
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const useAirtagDeviceCols = () => {
    const { t } = useTranslation()

    return useMemo<ColumnDef<AirtagDevice>[]>(
        () => [
            {
                header: "ID",
                accessorKey: "id",
            },
            {
                header: t("Device ID"),
                accessorKey: "device_id",
            },
            {
                header: t("Device uuid"),
                accessorKey: "device_uuid",
            },


        ],
        [t],
    )
}
