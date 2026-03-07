import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

export const useCostCols = () => {
    return useMemo<ColumnDef<TruckInfo>[]>(
        () => [
            {
                header: "Rusumi",
                accessorKey: "vehicle_type",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-semibold uppercase">
                        {row.original.vehicle_type}
                    </span>
                ),
            },

            {
                header: "Avto raqam",
                accessorKey: "primary_truck",
                enableSorting: true,
                cell: ({ row }) => {
                    return (
                        <span>{row.original.primary_truck || "Noma'lum"}</span>
                    )
                },
            },
            {
                header: "Kimniki",
                accessorKey: "owner",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="capitalize">{row.original.owner}</span>
                ),
            },
            {
                header: "Reys soni",
                accessorKey: "trip_count",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-sm">{row.original.trip_count}</span>
                ),
            },
            {
                header: "Probeg km",
                accessorKey: "mileage",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.mileage || "—"}</span>,
            },
            {
                header: "Yoqilg'i turi",
                accessorKey: "fuel_type",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.fuel_type}
                    </span>
                ),
            },
            {
                header: "Yoqilg'i sarfi",
                accessorKey: "fuel_consumed",
                enableSorting: true,
                cell: ({ row }) => {
                    return (
                        <span>{formatMoney(row.original.fuel_consumed)}</span>
                    )
                },
            },
            {
                header: "Yoqilg'i sarfi",
                accessorKey: "fuel_consumed",
                enableSorting: true,
                cell: ({ row }) => {
                    return (
                        <span>{formatMoney(row.original.fuel_consumed)}</span>
                    )
                },
            },
            {
                header: "Litr /km",
                accessorKey: "litr",
                enableSorting: true,
            },
            {
                header: "Yoqilg'i summa",
                accessorKey: "fuel_cost",
                enableSorting: true,
                cell: ({ row }) => {
                    return <span>{formatMoney(row.original.fuel_cost)}</span>
                },
            },
            {
                header: "Oylik",
                accessorKey: "revenue",
                enableSorting: true,
                cell: ({ row }) => {
                    return <span>{formatMoney(row.original.salary)}</span>
                },
            },
            {
                header: "Tamirlash",
                accessorKey: "repair",
                enableSorting: true,
                cell: ({ row }) => {
                    return <span>{formatMoney(row.original.repair)}</span>
                },
            },
            {
                header: "Boshqa xarajatlar",
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => {
                    return (
                        <span>{formatMoney(row.original.other_expense)}</span>
                    )
                },
            },
            {
                header: "Jami xarajatlar",
                accessorKey: "total_expenses",
                enableSorting: true,
                cell: ({ row }) => {
                    return (
                        <span>{formatMoney(row.original.total_expense)}</span>
                    )
                },
            },
            {
                header: "Tushum",
                accessorKey: "revenue",
                enableSorting: true,
                cell: ({ row }) => {
                    return <span>{formatMoney(row.original.revenue)}</span>
                },
            },
            {
                header: "Foyda",
                accessorKey: "profit",
                enableSorting: true,
                cell: ({ row }) => {
                    return <span>{formatMoney(row.original.profit)}</span>
                },
            },
        ],
        [],
    )
}
