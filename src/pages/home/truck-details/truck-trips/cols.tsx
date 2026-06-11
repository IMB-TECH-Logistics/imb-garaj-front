import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { formatMoney } from "@/lib/format-money"
import { Badge } from "@/components/ui/badge"

// At most two figures after the decimal comma, trailing zeros trimmed.
const round2 = (v: unknown) => Number((Number(v ?? 0) || 0).toFixed(2))

export interface OrderTripType {
    date: string
    loading_name: string
    unloading_name: string
    cargo_type_name: string | null
    client_name: string | null
    income: number
    type: number
}

export interface TripDailyStatisticType {
    id: number
    total_expense: number | null
    total_mileage: number
    start_mileage_image: string | null
    end_mileage_image: string | null
    fuel_consume: number
    orders_trip: OrderTripType[]
}

export const useOrderCols = (opts?: { onExpenseClick?: (tripId: number, totalExpense?: number | null) => void }) => {
    return useMemo<ColumnDef<any>[]>(
        () => [
            {
                header: "Sana",
                accessorKey: "date",
                size: 100,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (data.is_summary) return <span className="font-bold text-white">Jami</span>
                    return <span className="font-medium text-muted-foreground">{data.date}</span>
                },
            },
            {
                header: "Marshrut",
                accessorKey: "route",
                size: 200,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (data.is_summary) return null;
                    return (
                        <span>
                            {data.loading_name} - {data.unloading_name}
                        </span>
                    )
                },
            },
            {
                header: "Yuk turi",
                accessorKey: "cargo_type_name",
                size: 100,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (data.is_summary) return null;
                    if (data.type === 2) {
                        return <Badge variant="secondary">Yuksiz</Badge>
                    }
                    if (data.type === 1 && !data.cargo_type_name) {
                        return <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/15">Yukli</Badge>
                    }
                    return <span>{data.cargo_type_name || "—"}</span>
                },
            },
            {
                header: "Firma (Mijoz)",
                accessorKey: "client_name",
                size: 120,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (data.is_summary) return null;
                    return <span>{data.client_name || "—"}</span>
                },
            },
            {
                header: "Masofa",
                accessorKey: "total_mileage",
                size: 80,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (!data.is_summary) return null;
                    return <span className="font-bold text-white">{round2(data.total_mileage)} km</span>
                },
            },
            {
                header: "Yoqilg'i sarfi",
                accessorKey: "fuel_consume",
                size: 100,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (!data.is_summary) return null;
                    return <span className="font-bold text-white">{round2(data.fuel_consume)}</span>
                },
            },
            {
                header: "Xarajat",
                accessorKey: "total_expense",
                size: 120,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (!data.is_summary) return null;
                    return (
                        <span
                            className="font-bold text-red-500 underline cursor-pointer hover:text-primary"
                            onClick={(e) => {
                                e.stopPropagation()
                                opts?.onExpenseClick?.(data.trip_id, data.total_expense)
                            }}
                        >
                            - {formatMoney(data.total_expense ?? 0)}
                        </span>
                    )
                },
            },
            {
                header: "Tushum",
                accessorKey: "income",
                size: 120,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (data.is_summary) {
                        return <span className="font-bold text-white">{formatMoney(data.income ?? 0)}</span>
                    }
                    return <span className="font-medium text-green-600">{formatMoney(data.income ?? 0)}</span>
                },
            },
            {
                header: "Foyda",
                id: "profit",
                size: 120,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (!data.is_summary) return null;
                    const profit = (data.income || 0) - (data.total_expense || 0)
                    return <span className={`font-bold ${profit > 0 ? "text-green-600" : profit < 0 ? "text-red-600" : "text-white"}`}>{formatMoney(profit)}</span>
                },
            },
        ],
        [opts?.onExpenseClick],
    )
}

export const useCostCols = useOrderCols
