import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

export type SelectableItem = { id: number; name: string }

export type DirectionRow = {
    id: number
    owner_name: string
    load_name: string
    unload_name: string
    cargo_type_name: string
    payment_type_name: string
    currency: 1 | 2
    amount: string | null
    current_price: string | number | null
}

const CURRENCY_LABELS: Record<number, string> = {
    1: "UZS",
    2: "USD",
}


export const useDirectionColumns = () =>
    useMemo<ColumnDef<DirectionRow>[]>(
        () => [
            { accessorKey: "load_name", header: "Yuklash manzili", enableSorting: true },
            { accessorKey: "unload_name", header: "Yuk tushirish manzili", enableSorting: true },
            { accessorKey: "owner_name", header: "Yuk egasi", enableSorting: true },
            { accessorKey: "cargo_type_name", header: "Yuk turi", enableSorting: true },
            { accessorKey: "payment_type_name", header: "To'lov turi", enableSorting: true },
            {
                accessorKey: "current_price",
                header: "Summa",
                enableSorting: true,
                cell: ({ row }) =>
                    formatMoney(Number(row.original.current_price ?? 0)),
            },
            {
                accessorKey: "currency",
                header: "Valyuta",
                enableSorting: true,
                cell: ({ row }) =>
                    CURRENCY_LABELS[row.original.currency] ?? "-",
            },
        ],
        [],
    )
