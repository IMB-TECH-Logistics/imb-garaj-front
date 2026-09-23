import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { formatMoney } from "@/lib/format-money"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"

// At most two figures after the decimal comma, trailing zeros trimmed.
const round2 = (v: unknown) => Number((Number(v ?? 0) || 0).toFixed(2))

const toNum = (v: unknown) => Number(v ?? 0) || 0

export interface OrderTripType {
    date: string
    expense: number | string | null
    loading_name: string
    unloading_name: string
    cargo_type_name: string | null
    client_name: string | null
    income: number
    type: number
}

export interface TripDailyStatisticType {
    id: number
    other_expense: number | string | null
    start: string | null
    end: string | null
    hidden_order_count: number
    total_expense: number | null
    other_income: number | string | null
    total_mileage: number
    start_mileage_image: string | null
    end_mileage_image: string | null
    fuel_consume: number
    orders_trip: OrderTripType[]
}

export const useOrderCols = (opts?: { onExpenseClick?: (tripId: number, totalExpense?: number | null) => void }) => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<any>[]>(
        () => [
            {
                header: t("form.date"),
                accessorKey: "date",
                size: 100,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (data.is_summary) return <span className="font-bold text-white">Jami</span>
                    if (data.is_residual) return <span className="text-muted-foreground">—</span>
                    return <span className="font-medium text-muted-foreground">{data.date}</span>
                },
            },
            {
                header: t("table.direction"),
                accessorKey: "route",
                size: 200,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (data.is_summary) return null;
                    if (data.is_residual) {
                        return (
                            <span className="italic text-muted-foreground">
                                {t("page.turnover_detail")}
                            </span>
                        )
                    }
                    return (
                        <span>
                            {data.loading_name} - {data.unloading_name}
                        </span>
                    )
                },
            },
            {
                header: t("form.cargo_type"),
                accessorKey: "cargo_type_name",
                size: 100,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (data.is_summary) return null;
                    if (data.type === 2) {
                        return <Badge variant="secondary">{t("table.status_empty")}</Badge>
                    }
                    if (data.type === 1 && !data.cargo_type_name) {
                        return <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/15">Yukli</Badge>
                    }
                    return <span>{data.cargo_type_name || "—"}</span>
                },
            },
            {
                header: t("table.firm"),
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
                header: t("table.distance_km"),
                accessorKey: "total_mileage",
                size: 80,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (!data.is_summary) return <span className="text-muted-foreground">—</span>;
                    return <span className="font-bold text-white">{round2(data.total_mileage)} km</span>
                },
            },
            {
                header: t("table.fuel_consumption"),
                accessorKey: "fuel_consume",
                size: 100,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (!data.is_summary) return <span className="text-muted-foreground">—</span>;
                    return <span className="font-bold text-white">{round2(data.fuel_consume)}</span>
                },
            },
            {
                header: t("table.total_expense"),
                accessorKey: "total_expense",
                size: 120,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    if (!data.is_summary) {
                        const value = toNum(data.expense)
                        if (!value) {
                            return <span className="text-muted-foreground">—</span>
                        }
                        return (
                            <span className="font-medium text-red-600">
                                {formatMoney(value)}
                            </span>
                        )
                    }
                    const total = toNum(data.total_expense)
                    if (!total) {
                        return <span className="font-bold text-muted-foreground">—</span>
                    }
                    return (
                        <span
                            className="font-bold text-red-500 underline cursor-pointer hover:text-primary"
                            onClick={(e) => {
                                e.stopPropagation()
                                opts?.onExpenseClick?.(data.trip_id, data.total_expense)
                            }}
                        >
                            {formatMoney(total)}
                        </span>
                    )
                },
            },
            {
                header: t("table.total_income"),
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
                header: t("table.profit"),
                id: "profit",
                size: 120,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    const expense = data.is_summary ? toNum(data.total_expense) : toNum(data.expense)
                    const profit = toNum(data.income) - expense
                    if (!data.is_summary) {
                        return (
                            <span className={profit > 0 ? "font-medium text-green-600" : profit < 0 ? "font-medium text-red-600" : "text-muted-foreground"}>
                                {formatMoney(profit)}
                            </span>
                        )
                    }
                    return <span className={`font-bold ${profit > 0 ? "text-green-600" : profit < 0 ? "text-red-600" : "text-white"}`}>{formatMoney(profit)}</span>
                },
            },
        ],
        [t, opts?.onExpenseClick],
    )
}

export const useCostCols = useOrderCols
