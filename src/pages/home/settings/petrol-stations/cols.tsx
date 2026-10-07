import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { formatQuantity } from "./cashflow-cols"

export type PetrolStationRow = {
    id: number
    name: string
    address: string
    latitude: number | null
    longitude: number | null
    balance: string | number | null
    has_contract?: boolean
    total_outcomes?: string | number | null
    total_liters?: string | number | null
    total_gas?: string | number | null
}

export const usePetrolStationColumns = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<PetrolStationRow>[]>(
        () => [
            { accessorKey: "name", header: t("form.name"), enableSorting: true },
            { accessorKey: "address", header: t("form.address"), enableSorting: true },
            {
                id: "fuel",
                header: "Olingan yoqilg'i",
                cell: ({ row }) => (
                    <span className="tabular-nums whitespace-nowrap text-amber-600">
                        {formatQuantity(Number(row.original.total_liters ?? 0), "liter")}
                        {" · "}
                        {formatQuantity(Number(row.original.total_gas ?? 0), "m3")}
                    </span>
                ),
            },
            {
                accessorKey: "total_outcomes",
                header: "Summa",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums text-amber-600">
                        {formatMoney(Number(row.original.total_outcomes ?? 0))}
                    </span>
                ),
            },
            {
                accessorKey: "balance",
                header: "Zapravka balansi",
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
        [t],
    )

}
