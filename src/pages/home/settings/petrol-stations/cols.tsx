import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

export type PetrolStationRow = {
    id: number
    name: string
    address: string
    latitude: number | null
    longitude: number | null
    balance: string | number | null
}

export const usePetrolStationColumns = () =>
    useMemo<ColumnDef<PetrolStationRow>[]>(
        () => [
            { accessorKey: "name", header: "Nomi", enableSorting: true },
            { accessorKey: "address", header: "Manzili", enableSorting: true },
            {
                accessorKey: "balance",
                header: "Balans",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {formatMoney(Number(row.original.balance ?? 0))} so'm
                    </span>
                ),
            },
        ],
        [],
    )
