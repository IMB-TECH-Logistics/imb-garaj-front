import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { formatSom } from "@/lib/money-format"
import { Badge } from "@/components/ui/badge"

// At most two figures after the decimal comma, trailing zeros trimmed.
const round2 = (v: unknown) => Number((Number(v ?? 0) || 0).toFixed(2))

/** IN-13: qiymat yo'q katak. `reason` berilsa NEGA yo'qligi tooltipda ko'rinadi —
 *  "yuklanmadi"mi yoki "bu darajada yuritilmaydi"mi degan savol qolmasin. */
const NoValue = ({ reason }: { reason?: string }) => (
    <span
        className={reason ? "text-muted-foreground/60 cursor-help border-b border-dotted border-muted-foreground/40" : "text-muted-foreground/60"}
        title={reason}
    >
        —
    </span>
)

/** IN-13: masofa va yoqilg'i ma'lumot modelida REYS darajasida yuritiladi
 *  (API buni `mileage_level`/`fuel_level` = "trip" bilan ochiq aytadi), shuning
 *  uchun buyurtma qatorida ular printsipial ravishda bo'lmaydi. */
const TRIP_LEVEL_REASON =
    "Bu ko'rsatkich buyurtma emas, REYS darajasida yuritiladi — qiymatni pastdagi \"Jami\" qatoridan ko'ring."

export interface OrderTripType {
    date: string
    loading_name: string
    unloading_name: string
    cargo_type_name: string | null
    client_name: string | null
    income: number
    /** IN-13: qator darajasidagi xarajat (backend endi qaytaradi). */
    expense?: number | string | null
    /** "trip" — ko'rsatkich reys darajasida yuritiladi, qatorda bo'lmaydi. */
    mileage_level?: string | null
    fuel_level?: string | null
    type: number
}

export interface TripDailyStatisticType {
    id: number
    total_expense: number | null
    /** IN-13: `total_expense` ning buyurtmalarga taqsimlangan / taqsimlanmagan qismi. */
    order_expense?: number | string | null
    unassigned_expense?: number | string | null
    /** IN-06: server hisoblagan jami tushum (qatorlar + reys darajasidagi kirim). */
    total_income?: number | string | null
    /** Buyurtmaga bog'lanmagan, reys darajasidagi kirim. */
    direct_income?: number | string | null
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
                    // IN-06: buyurtmaga bog'lanmagan, reys darajasidagi kirim/xarajat
                    if (data.is_direct) {
                        return (
                            <span className="font-medium italic text-muted-foreground">
                                Buyurtmasiz
                            </span>
                        )
                    }
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
                    if (data.is_direct) {
                        return (
                            <span className="text-xs text-muted-foreground">
                                Reysga to'g'ridan-to'g'ri yozilgan pul harakati
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
                    // IN-13: qatorda masofa yo'q — u reys darajasida yuritiladi.
                    if (!data.is_summary) return <NoValue reason={TRIP_LEVEL_REASON} />;
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
                    if (!data.is_summary) return <NoValue reason={TRIP_LEVEL_REASON} />;
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
                    // IN-13: qator darajasidagi xarajat endi API'da bor — chiziladi,
                    // shunda "Jami" ni qatorlardan tekshirib bo'ladi.
                    if (!data.is_summary) {
                        const rowExpense = Number(data.expense ?? 0) || 0
                        if (!rowExpense) {
                            return (
                                <NoValue reason="Bu buyurtmaga yozilgan xarajat yo'q (0 so'm)" />
                            )
                        }
                        return (
                            <span className="font-medium text-red-500">
                                −{formatSom(rowExpense)}
                            </span>
                        )
                    }
                    const expense = Number(data.total_expense ?? 0) || 0
                    const unassigned = Number(data.unassigned_expense ?? 0) || 0
                    return (
                        <span
                            className="font-bold text-red-500 underline cursor-pointer hover:text-primary"
                            title={
                                unassigned ?
                                    `Shundan ${formatSom(unassigned)} so'm hech qanday buyurtmaga bog'lanmagan (faqat reysga yozilgan).`
                                :   undefined
                            }
                            onClick={(e) => {
                                e.stopPropagation()
                                opts?.onExpenseClick?.(data.trip_id, data.total_expense)
                            }}
                        >
                            {/* IN-12: qiymat 0/null bo'lganda ilgari "- 0" chiqardi. */}
                            {expense ? `−${formatSom(expense)}` : "—"}
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
                        return <span className="font-bold text-white">{formatSom(data.income ?? 0)}</span>
                    }
                    return <span className="font-medium text-green-600">{formatSom(data.income ?? 0)}</span>
                },
            },
            {
                header: "Foyda",
                id: "profit",
                size: 120,
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original;
                    // IN-13: qator darajasida ham foyda ko'rsatiladi (tushum − xarajat).
                    if (!data.is_summary) {
                        const rowIncome = Number(data.income ?? 0) || 0
                        const rowExpense = Number(data.expense ?? 0) || 0
                        if (!rowIncome && !rowExpense) return <NoValue />
                        const rowProfit = rowIncome - rowExpense
                        return (
                            <span
                                className={`font-medium ${rowProfit > 0 ? "text-green-600" : rowProfit < 0 ? "text-red-600" : "text-muted-foreground"}`}
                            >
                                {formatSom(rowProfit)}
                            </span>
                        )
                    }
                    const profit =
                        (Number(data.income) || 0) - (Number(data.total_expense) || 0)
                    return <span className={`font-bold ${profit > 0 ? "text-green-600" : profit < 0 ? "text-red-600" : "text-white"}`}>{formatSom(profit)}</span>
                },
            },
        ],
        [opts?.onExpenseClick],
    )
}

export const useCostCols = useOrderCols
