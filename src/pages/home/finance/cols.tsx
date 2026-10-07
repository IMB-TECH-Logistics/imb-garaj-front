import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

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
    income: string | number | null
    expense: string | number | null
    vehicle_expense: string | number | null
    owner_id: number | null
    unpriced_count: number
    cargo_type_name: string | null
}

const toNum = (v: string | number | null | undefined): number =>
    Number(v ?? 0) || 0

const round3 = (v: string | number | null | undefined): number =>
    Math.round(toNum(v) * 1000) / 1000

// Har bir mashinaning yagona `fuel` turi bor — o'lchov birligi doim shu qiymatdan
// kelib chiqib aniqlanadi, hardcoded "litr" ishlatilmaydi.
const UNIT_LABEL: Record<string, string> = { methane: "m³", diesel: "litr" }
const unitFor = (fuel?: string | null) =>
    UNIT_LABEL[(fuel ?? "").toLowerCase()] ?? "litr"

export const useCostCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<OwnerStatistic>[]>(
        () => [
            {
                header: t("table.trip_type_name"),
                accessorKey: "truck_type_name",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-semibold uppercase">
                        {row.original.truck_type_name || "—"}
                    </span>
                ),
            },
            {
                header: t("table.truck_plate"),
                accessorKey: "truck_number",
                enableSorting: true,
                cell: ({ row }) => (
                    <span>{row.original.truck_number || "—"}</span>
                ),
            },
            {
                header: t("table.trips_ratio"),
                accessorKey: "order_count_empty",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-sm border py-1 px-2 rounded bg-muted">
                        {row.original.order_count_empty} / {row.original.order_count_busy}
                    </span>
                ),
            },
            {
                header: "Narxsiz reys",
                accessorKey: "unpriced_count",
                enableSorting: true,
                cell: ({ row }) =>
                    row.original.unpriced_count ?
                        <span className="text-xs font-medium py-0.5 px-2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            {row.original.unpriced_count}
                        </span>
                    :   <span className="text-muted-foreground">—</span>,
            },
            {
                header: t("table.mileage_km"),
                accessorKey: "total_mileage",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.total_mileage != null ? round3(row.original.total_mileage) : "—"}</span>,
            },
            {
                header: t("table.fuel_consumption"),
                accessorKey: "fuel_consume",
                enableSorting: true,
                cell: ({ row }) => {
                    if (row.original.fuel_consume === null) return <span>—</span>
                    return (
                        <span>
                            {formatMoney(round3(row.original.fuel_consume))}{" "}
                            {unitFor(row.original.fuel)}
                        </span>
                    )
                },
            },
            {
                header: "Sarfi / 100 km",
                accessorKey: "fuel_per_km",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = row.original.fuel_per_km
                    if (v == null) return <span>—</span>
                    return (
                        <span>
                            {Number((toNum(v) * 100).toFixed(1))}{" "}
                            {unitFor(row.original.fuel)}
                        </span>
                    )
                },
            },
            {
                header: t("form.expense"),
                accessorKey: "expense",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = round3(row.original.expense)
                    return <span className="text-red-600 font-medium">{v ? formatMoney(v) : "—"}</span>
                },
            },
            {
                header: "Reys daromadi",
                accessorKey: "income",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = round3(toNum(row.original.income))
                    return <span className="text-green-600 font-medium">{v ? formatMoney(v) : "—"}</span>
                },
            },
            {
                header: "Reys foydasi",
                id: "profit",
                enableSorting: true,
                cell: ({ row }) => {
                    const profit = round3(toNum(row.original.income) - toNum(row.original.expense))
                    return <span className={`font-medium ${profit >= 0 ? "text-blue-600" : "text-red-600"}`}>{formatMoney(profit)}</span>
                },
            },
            {
                header: "Mashina xarajati",
                accessorKey: "vehicle_expense",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = round3(row.original.vehicle_expense)
                    return <span className="text-red-600 font-medium">{v ? formatMoney(v) : "—"}</span>
                },
            },
            {
                header: "Sof foyda",
                id: "net",
                enableSorting: true,
                cell: ({ row }) => {
                    const net = round3(
                        toNum(row.original.income) - toNum(row.original.expense) - toNum(row.original.vehicle_expense),
                    )
                    return <span className={`font-semibold ${net >= 0 ? "text-blue-600" : "text-red-600"}`}>{formatMoney(net)}</span>
                },
            },
        ],
        [t],
    )
}
