import { Badge } from "@/components/ui/badge"
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
    created: string
}

const ACTION_LABEL: Record<number, { label: string; tone: "income" | "expense" }> = {
    1: { label: "To'ldirildi", tone: "income" },
    [-1]: { label: "Sarflandi", tone: "expense" },
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

export const useStationCashFlowColumns = () =>
    useMemo<ColumnDef<StationCashFlowRow>[]>(
        () => [
            {
                accessorKey: "action",
                header: "Harakat",
                cell: ({ row }) => {
                    const a = ACTION_LABEL[row.original.action]
                    if (!a) return "—"
                    return (
                        <Badge
                            variant={
                                a.tone === "income" ? "default" : "destructive"
                            }
                        >
                            {a.label}
                        </Badge>
                    )
                },
            },
            {
                accessorKey: "amount",
                header: "Summa",
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {formatMoney(Number(row.original.amount ?? 0))}
                    </span>
                ),
            },
            {
                accessorKey: "currency",
                header: "Valyuta",
                cell: ({ row }) => CURRENCY_LABEL[row.original.currency] ?? "—",
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
                accessorKey: "created",
                header: "Vaqt",
                cell: ({ row }) => formatDateTime(row.original.created),
            },
        ],
        [],
    )
