import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

export interface OwnerStatistic {
    id: number
    truck_type_name: string
    truck_number: string
    owner_name: string
    order_count_busy: number
    order_count_empty: number
    total_mileage: number | null
    fuel: string
    fuel_consume: number | null
    fuel_per_km: number
    income_uzs: number | null
    income_usd: number | null
    total_expense: number | null
    cargo_type_name: string | null
}

export const useCostCols = () => {
    return useMemo<ColumnDef<OwnerStatistic>[]>(
        () => [
            {
                header: "Rusumi",
                accessorKey: "truck_type_name",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-semibold uppercase">
                        {row.original.truck_type_name || "—"}
                    </span>
                ),
            },
            {
                header: "Avto raqam",
                accessorKey: "truck_number",
                enableSorting: true,
                cell: ({ row }) => {
                    return (
                        <span>{row.original.truck_number || "Noma'lum"}</span>
                    )
                },
            },
            {
                header: "Reys (Band/Bo'sh)",
                accessorKey: "order_count_busy",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-sm border py-1 px-2 rounded bg-muted">
                        {row.original.order_count_busy} / {row.original.order_count_empty}
                    </span>
                ),
            },
            {
                header: "Probeg km",
                accessorKey: "total_mileage",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.total_mileage ?? "—"}</span>,
            },
            {
                header: "Yoqilg'i turi",
                accessorKey: "fuel",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium bg-muted py-0.5 px-2 rounded-sm text-xs capitalize">
                        {row.original.fuel || "—"}
                    </span>
                ),
            },
            {
                header: "Yoqilg'i sarfi",
                accessorKey: "fuel_consume",
                enableSorting: true,
                cell: ({ row }) => {
                    return (
                        <span>{row.original.fuel_consume !== null ? formatMoney(row.original.fuel_consume) : "—"}</span>
                    )
                },
            },
            {
                header: "Yuk turi",
                accessorKey: "cargo_type_name",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="capitalize">{row.original.cargo_type_name || "—"}</span>
                ),
            },
            {
                header: "Litr / km",
                accessorKey: "fuel_per_km",
                enableSorting: true,
                cell: ({ row }) => {
                    return (
                        <span>{row.original.fuel_per_km ?? "—"}</span>
                    )
                },
            },
            {
                header: "Tushum (UZS)",
                accessorKey: "income_uzs",
                enableSorting: true,
                cell: ({ row }) => {
                    return <span className="text-green-600 font-medium">{row.original.income_uzs !== null ? formatMoney(row.original.income_uzs) : "—"}</span>
                },
            },
            {
                header: "Tushum (USD)",
                accessorKey: "income_usd",
                enableSorting: true,
                cell: ({ row }) => {
                    return <span className="text-green-600 font-medium">{row.original.income_usd !== null ? `$${formatMoney(row.original.income_usd)}` : "—"}</span>
                },
            },
            {
                header: "Jami xarajat",
                accessorKey: "total_expense",
                enableSorting: true,
                cell: ({ row }) => {
                    return <span className="text-red-600 font-medium">{row.original.total_expense !== null ? formatMoney(row.original.total_expense) : "—"}</span>
                },
            },
        ],
        [],
    )
}
