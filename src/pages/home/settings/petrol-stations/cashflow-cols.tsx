import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

export type StationCashFlowRow = {
    id: number
    action: number
    amount: string | number
    currency: number
    currency_course: string | number | null
    comment: string | null
    petrol_station: number
    petrol_station_name: string | null
    executor: number
    executor_name: string | null
    driver: number | null
    driver_name: string | null
    vehicle_plate: string | null
    liters: number | null
    price_per_liter: number | null
    running_balance: number | null
    created: string
}

const CURRENCY_LABEL: Record<number, string> = {
    1: "UZS",
    2: "USD",
}

const formatDateTime = (s?: string | null) => {
    if (!s) return "—"
    const d = new Date(s)
    if (isNaN(d.getTime())) return s
    return d.toLocaleString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })
}

const formatLiters = (v: number | null) =>
    v == null ? "—" : `${v.toLocaleString("uz-UZ")} L`

export const useStationCashFlowColumns = () =>
    useMemo<ColumnDef<StationCashFlowRow>[]>(
        () => [
            {
                accessorKey: "created",
                header: "Vaqt",
                cell: ({ row }) => formatDateTime(row.original.created),
            },
            {
                accessorKey: "driver_name",
                header: "Haydovchi",
                cell: ({ row }) => {
                    if (!row.original.driver_name) return "—"
                    return (
                        <div className="flex flex-col">
                            <span className="font-medium">
                                {row.original.driver_name}
                            </span>
                            {row.original.vehicle_plate && (
                                <span className="text-[11px] text-muted-foreground">
                                    {row.original.vehicle_plate}
                                </span>
                            )}
                        </div>
                    )
                },
            },
            {
                accessorKey: "liters",
                header: "Litr",
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {formatLiters(row.original.liters)}
                    </span>
                ),
            },
            {
                accessorKey: "price_per_liter",
                header: "Litr narxi",
                cell: ({ row }) =>
                    row.original.price_per_liter == null ? (
                        "—"
                    ) : (
                        <span className="tabular-nums text-muted-foreground">
                            {formatMoney(Number(row.original.price_per_liter))}{" "}
                            so'm
                        </span>
                    ),
            },
            {
                accessorKey: "comment",
                header: "Izoh",
                cell: ({ row }) => row.original.comment || "—",
            },
            {
                accessorKey: "executor_name",
                header: "Kim",
                cell: ({ row }) => row.original.executor_name ?? "—",
            },
            {
                accessorKey: "amount",
                header: "Summa",
                cell: ({ row }) => {
                    const isIncome = row.original.action === 1
                    const amount = Number(row.original.amount ?? 0)
                    const currency = row.original.currency
                    const inUzs =
                        currency === 2
                            ? amount *
                              Number(row.original.currency_course ?? 0)
                            : amount
                    return (
                        <div className="flex flex-col">
                            <span
                                className={`tabular-nums font-medium ${
                                    isIncome
                                        ? "text-emerald-600"
                                        : "text-rose-600"
                                }`}
                            >
                                {isIncome ? "+" : "−"}
                                {formatMoney(inUzs)} so'm
                            </span>
                            {currency === 2 && (
                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                    {formatMoney(amount)}{" "}
                                    {CURRENCY_LABEL[currency]} ×{" "}
                                    {formatMoney(
                                        Number(
                                            row.original.currency_course ?? 0,
                                        ),
                                    )}
                                </span>
                            )}
                        </div>
                    )
                },
            },
            {
                accessorKey: "running_balance",
                header: "Balans",
                cell: ({ row }) => (
                    <span className="tabular-nums font-medium">
                        {formatMoney(Number(row.original.running_balance ?? 0))}{" "}
                        so'm
                    </span>
                ),
            },
        ],
        [],
    )
