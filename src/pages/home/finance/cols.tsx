import { formatMoney, formatMoneyText, formatNumber } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export interface OwnerStatistic {
    id: number
    truck_type_name: string
    truck_number: string
    model_name?: string | null
    owner_name: string
    order_count_busy: number
    order_count_empty: number
    total_mileage: number | null
    fuel: string
    fuel_consume: number | null
    fuel_per_km: number
    fuel_estimated?: boolean
    mileage_gps?: boolean
    fuel_norm_per_100?: number
    gps_mileage?: number
    odometer_estimate?: number
    odometer_photo?: number | null
    income: string | number | null
    expense: string | number | null
    vehicle_expense: string | number | null
    investor_expense?: string | number | null
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
const unitFor = (fuel: string | null | undefined, liter: string) =>
    (fuel ?? "").toLowerCase() === "methane" ? "m³" : liter

export const useCostCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<OwnerStatistic>[]>(
        () => [
            {
                header: t("table.truck_plate"),
                accessorKey: "truck_number",
                enableSorting: true,
                cell: ({ row }) => (
                    <span>{row.original.truck_number || "—"}</span>
                ),
            },
            {
                header: t("table.trip_type_name"),
                accessorKey: "model_name",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-semibold uppercase">
                        {row.original.model_name || "—"}
                    </span>
                ),
            },
            {
                header: t("route_norms.cols.trips"),
                accessorKey: "order_count_busy",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.order_count_busy}</span>,
            },
            {
                header: t("fin.cols.unpriced_trips"),
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
                cell: ({ row }) => {
                    const r = row.original
                    if (r.total_mileage == null) return <span>—</span>
                    if (!r.mileage_gps) return <span>{round3(r.total_mileage)}</span>
                    return (
                        <span
                            className="whitespace-nowrap"
                            title={t("fin.cols.mileage_gps_hint", {
                                gps: formatMoneyText(r.gps_mileage ?? 0),
                                photo: r.odometer_photo != null ? formatMoneyText(r.odometer_photo) : "—",
                                odo: formatMoneyText(r.odometer_estimate ?? 0),
                            })}
                        >
                            ≈ {formatNumber(round3(r.total_mileage))}
                            {r.odometer_estimate != null && (
                                <span className="block text-xs text-muted-foreground">
                                    {t("fin.cols.odometer_short", { odo: formatMoneyText(r.odometer_estimate) })}
                                </span>
                            )}
                        </span>
                    )
                },
            },
            {
                header: t("table.fuel_consumption"),
                accessorKey: "fuel_consume",
                enableSorting: true,
                cell: ({ row }) => {
                    if (row.original.fuel_consume === null) return <span>—</span>
                    const estimated = row.original.fuel_estimated
                    return (
                        <span title={estimated ? (row.original.fuel_norm_per_100 != null ? t("fin.cols.fuel_norm_estimated", { rate: row.original.fuel_norm_per_100 }) : t("fin.cols.fuel_estimated")) : undefined}>
                            {estimated ? "≈ " : ""}
                            {formatNumber(round3(row.original.fuel_consume))}{" "}
                            {unitFor(row.original.fuel, t("fin.common.unit_liter"))}
                        </span>
                    )
                },
            },
            {
                header: t("fin.cols.fuel_per_100km"),
                accessorKey: "fuel_per_km",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = row.original.fuel_per_km
                    if (v == null) return <span>—</span>
                    const estimated = row.original.fuel_estimated
                    return (
                        <span title={estimated ? (row.original.fuel_norm_per_100 != null ? t("fin.cols.fuel_norm_estimated", { rate: row.original.fuel_norm_per_100 }) : t("fin.cols.fuel_estimated")) : undefined}>
                            {estimated ? "≈ " : ""}
                            {Number((toNum(v) * 100).toFixed(1))}{" "}
                            {unitFor(row.original.fuel, t("fin.common.unit_liter"))}
                        </span>
                    )
                },
            },
            {
                header: t("fin.cols.trip_income"),
                accessorKey: "income",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = round3(toNum(row.original.income))
                    return <span className="text-green-600 font-medium">{v ? formatMoney(v) : "—"}</span>
                },
            },
            {
                header: t("fin.finance_main.trip_expense"),
                accessorKey: "expense",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = round3(row.original.expense)
                    return <span className="text-red-600 font-medium">{v ? formatMoney(v) : "—"}</span>
                },
            },
            {
                header: t("fin.cols.trip_profit"),
                id: "profit",
                enableSorting: true,
                cell: ({ row }) => {
                    const profit = round3(toNum(row.original.income) - toNum(row.original.expense))
                    return <span className={`font-medium ${profit >= 0 ? "text-blue-600" : "text-red-600"}`}>{formatMoney(profit)}</span>
                },
            },
            {
                header: t("fin.cols.vehicle_expense"),
                id: "vehicle_expense",
                accessorFn: (r) => toNum(r.vehicle_expense) - toNum(r.investor_expense),
                enableSorting: true,
                cell: ({ row }) => {
                    const v = round3(toNum(row.original.vehicle_expense) - toNum(row.original.investor_expense))
                    return <span className="text-red-600 font-medium">{v ? formatMoney(v) : "—"}</span>
                },
            },
            {
                header: t("fin.cols.net_profit"),
                id: "net",
                enableSorting: true,
                cell: ({ row }) => {
                    const net = round3(
                        toNum(row.original.income) -
                            toNum(row.original.expense) -
                            (toNum(row.original.vehicle_expense) - toNum(row.original.investor_expense)),
                    )
                    return <span className={`font-semibold ${net >= 0 ? "text-blue-600" : "text-red-600"}`}>{formatMoney(net)}</span>
                },
            },
            {
                header: t("fin.cols.investor_expense"),
                id: "investor_expense",
                accessorFn: (r) => toNum(r.investor_expense),
                enableSorting: true,
                cell: ({ row }) => {
                    const v = round3(row.original.investor_expense)
                    return <span className="text-orange-600 font-medium">{v ? formatMoney(v) : "—"}</span>
                },
            },
        ],
        [t],
    )
}
