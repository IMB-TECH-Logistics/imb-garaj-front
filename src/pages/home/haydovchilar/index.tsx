import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { DRIVERS_LIST } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatPhoneNumber } from "@/pages/home/settings/customers/phone-number"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useMemo } from "react"

type DriverRow = {
    id: number
    first_name: string
    last_name: string
    full_name: string
    username: string
    phone: string | null
    experience: number
    completed_trips: number
    total_trips: number
    ongoing_trips: number
    completed_orders: number
    total_orders: number
    revenue_uzs: string | number
    revenue_usd: string | number
    salary_paid_uzs: string | number
    total_distance_km: string | number
    total_fuel_liters: string | number
    fuel_per_100km: string | number
    coverage: number
    balance_uzs: string | number
    latest_trip_id: number | null
    latest_trip_end: string | null
    score: string | number
    tier: "A" | "B" | "C" | "D"
}

const num = (v: unknown) => Number(v ?? 0) || 0

const TIER_STYLES: Record<DriverRow["tier"], string> = {
    A: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    B: "bg-primary/10 text-primary border-primary/30",
    C: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    D: "bg-rose-500/15 text-rose-500 border-rose-500/30",
}

const useCols = () =>
    useMemo<ColumnDef<DriverRow>[]>(
        () => [
            {
                header: "Ism",
                accessorKey: "first_name",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.first_name} {row.original.last_name}
                    </span>
                ),
            },
            {
                header: "Telefon",
                accessorKey: "phone",
                cell: ({ row }) =>
                    formatPhoneNumber(row.original.phone || "—"),
            },
            {
                header: "Tajriba",
                accessorKey: "experience",
                enableSorting: true,
                cell: ({ row }) =>
                    row.original.experience > 0
                        ? `${row.original.experience} yil`
                        : "-",
            },
            {
                header: "Reyslar",
                accessorKey: "completed_trips",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original.completed_trips} /{" "}
                        {row.original.total_trips}
                    </span>
                ),
            },
            {
                header: "Yoqilg‘i (l/100km)",
                accessorKey: "fuel_per_100km",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = num(row.original.fuel_per_100km)
                    if (v <= 0)
                        return (
                            <span className="text-muted-foreground">—</span>
                        )
                    const cls =
                        v <= 26
                            ? "text-emerald-500"
                            : v <= 32
                              ? "text-amber-500"
                              : "text-rose-500"
                    return (
                        <span
                            className={`tabular-nums font-medium ${cls}`}
                        >
                            {v.toFixed(1)}
                        </span>
                    )
                },
            },
            {
                header: "Qamrov (hudud)",
                accessorKey: "coverage",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original.coverage}
                    </span>
                ),
            },
            {
                header: "Olib kelgan summa",
                accessorKey: "revenue_uzs",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums font-medium">
                        {formatMoney(num(row.original.revenue_uzs))} so’m
                    </span>
                ),
            },
            {
                header: "Balans",
                accessorKey: "balance_uzs",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = num(row.original.balance_uzs)
                    return (
                        <span
                            className={
                                v < 0
                                    ? "text-red-500 font-medium"
                                    : v > 0
                                      ? "text-green-500 font-medium"
                                      : ""
                            }
                        >
                            {formatMoney(v)} so’m
                        </span>
                    )
                },
            },
            {
                header: "Reyting",
                accessorKey: "score",
                enableSorting: true,
                cell: ({ row }) => {
                    const score = Math.round(num(row.original.score))
                    return (
                        <div className="flex items-center gap-2">
                            <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-md border text-[11px] font-bold ${TIER_STYLES[row.original.tier]}`}
                            >
                                {row.original.tier}
                            </span>
                            <span className="tabular-nums font-semibold">
                                {score}
                            </span>
                        </div>
                    )
                },
            },
        ],
        [],
    )

export default function HaydovchilarList() {
    const navigate = useNavigate()
    const search = useSearch({ strict: false }) as any
    const cols = useCols()

    const { data, isLoading } = useGet<DriverRow[]>(DRIVERS_LIST, {
        params: { search: search.driver_search },
    })

    const rows = data ?? []

    const handleRowClick = (row: DriverRow) => {
        navigate({
            to: "/haydovchilar/$id",
            params: { id: row.id.toString() },
            search: { name: row.full_name } as any,
        })
    }

    return (
        <DataTable
            loading={isLoading}
            columns={cols}
            data={rows}
            numeration
            viewAll
            onRowClick={handleRowClick}
            head={
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold">Haydovchilar</h1>
                        <Badge className="text-sm">
                            {formatMoney(rows.length)}
                        </Badge>
                    </div>
                </div>
            }
        />
    )
}
