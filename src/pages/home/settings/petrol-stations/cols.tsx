import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { formatQuantity } from "./cashflow-cols"

export type FuelType = "methane" | "diesel"

export type PetrolStationRow = {
    id: number
    name: string
    address: string
    latitude: number | null
    longitude: number | null
    balance: string | number | null
    has_contract?: boolean
    fuel_type?: FuelType
    total_outcomes?: string | number | null
    total_liters?: string | number | null
    total_gas?: string | number | null
}

export const usePetrolStationColumns = (fuel: FuelType) => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<PetrolStationRow>[]>(
        () => [
            { accessorKey: "name", header: t("form.name"), enableSorting: true },
            { accessorKey: "address", header: t("form.address"), enableSorting: true },
            {
                id: "fuel",
                header: t("settings.petrol.fuel_received"),
                cell: ({ row }) => (
                    <span className="tabular-nums whitespace-nowrap text-amber-600">
                        {fuel === "diesel" ?
                            formatQuantity(Number(row.original.total_liters ?? 0), "liter")
                        :   formatQuantity(Number(row.original.total_gas ?? 0), "m3")}
                    </span>
                ),
            },
            {
                accessorKey: "total_outcomes",
                header: t("form.amount_total"),
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums text-amber-600">
                        {formatMoney(Number(row.original.total_outcomes ?? 0))}
                    </span>
                ),
            },
            {
                accessorKey: "balance",
                header: t("settings.petrol.station_balance"),
                enableSorting: true,
                cell: ({ row }) => (
                    <span
                        className={
                            Number(row.original.balance ?? 0) < 0 ? "tabular-nums text-rose-600"
                            : Number(row.original.balance ?? 0) > 0 ? "tabular-nums text-emerald-600"
                            : "tabular-nums"
                        }
                    >
                        {formatMoney(Number(row.original.balance ?? 0))}
                    </span>
                ),
            },
        ],
        [t, fuel],
    )

}
