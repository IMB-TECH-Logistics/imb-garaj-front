import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export type GeoZone = {
    id: number
    name: string
    lat: number
    lng: number
    radius_m: number
    address?: string | null
    directions_count?: number
    created?: string
}

export const useGeoZoneColumns = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<GeoZone>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.name"),
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.name}</span>
                ),
            },
            {
                accessorKey: "address",
                header: "Manzil",
                cell: ({ row }) => row.original.address || "—",
            },
            {
                accessorKey: "radius_m",
                header: "Radius (m)",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">{row.original.radius_m}</span>
                ),
            },
            {
                accessorKey: "directions_count",
                header: "Yo'nalishlar",
                cell: ({ row }) => row.original.directions_count ?? 0,
            },
        ],
        [t],
    )
}
