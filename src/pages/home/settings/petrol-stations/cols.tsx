import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export type PetrolStationRow = {
    id: number
    name: string
    address: string
    latitude: number | null
    longitude: number | null
    balance: string | number | null
}

export const usePetrolStationColumns = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<PetrolStationRow>[]>(
        () => [
            { accessorKey: "name", header: t("form.name"), enableSorting: true },
            { accessorKey: "address", header: t("form.address"), enableSorting: true },
            {
                accessorKey: "balance",
                header: t("form.balance"),
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {formatMoney(Number(row.original.balance ?? 0))} so'm
                    </span>
                ),
            },
        ],
        [t],
    )

}
