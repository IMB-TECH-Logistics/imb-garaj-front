import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import {
    DRIVERS_BALANCE,
    SETTINGS_DRIVERS,
    TRIPS_DRIVER_STATS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatPhoneNumber } from "@/pages/home/settings/customers/phone-number"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useMemo } from "react"

type DriverBalance = { id: number; full_name: string; balance: string }

type DriverMetrics = {
    id: number
    completed_trips?: number
    revenue?: number
    fuel_per_100km?: number
    coverage?: number
    on_time_rate?: number
}

type DriverRow = DriversType & {
    _balance: number
    _score: number
    _experience: number
    _completed_trips: number
    _revenue: number
    _fuel_per_100km: number
    _coverage: number
    _on_time_rate: number
}

function meanStd(values: number[]): { m: number; s: number } {
    if (values.length === 0) return { m: 0, s: 1 }
    const m = values.reduce((acc, v) => acc + v, 0) / values.length
    if (values.length < 2) return { m, s: 1 }
    const variance =
        values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length
    return { m, s: Math.sqrt(variance) || 1 }
}

function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v))
}

function tier(score: number): { label: string; cls: string } {
    if (score >= 75)
        return { label: "A", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" }
    if (score >= 60)
        return { label: "B", cls: "bg-primary/10 text-primary border-primary/30" }
    if (score >= 40)
        return { label: "C", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" }
    return { label: "D", cls: "bg-rose-500/15 text-rose-500 border-rose-500/30" }
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
                    formatPhoneNumber(row.original?.driver?.phone || "—"),
            },
            {
                header: "Tajriba",
                accessorKey: "_experience",
                enableSorting: true,
                cell: ({ row }) =>
                    row.original._experience > 0
                        ? `${row.original._experience} yil`
                        : "-",
            },
            {
                header: "Reyslar",
                accessorKey: "_completed_trips",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original._completed_trips}
                    </span>
                ),
            },
            {
                header: "O'z vaqtida",
                accessorKey: "_on_time_rate",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original._on_time_rate}%
                    </span>
                ),
            },
            {
                header: "Yoqilg'i (l/100km)",
                accessorKey: "_fuel_per_100km",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = row.original._fuel_per_100km
                    const cls =
                        v <= 26
                            ? "text-emerald-500"
                            : v <= 32
                              ? "text-amber-500"
                              : "text-rose-500"
                    return (
                        <span className={`tabular-nums font-medium ${cls}`}>
                            {v.toFixed(1)}
                        </span>
                    )
                },
            },
            {
                header: "Qamrov (hudud)",
                accessorKey: "_coverage",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original._coverage}
                    </span>
                ),
            },
            {
                header: "Olib kelgan summa",
                accessorKey: "_revenue",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums font-medium">
                        {formatMoney(row.original._revenue)} so'm
                    </span>
                ),
            },
            {
                header: "Balans",
                accessorKey: "_balance",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = row.original._balance
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
                            {formatMoney(v)} so'm
                        </span>
                    )
                },
            },
            {
                header: "Reyting",
                accessorKey: "_score",
                enableSorting: true,
                cell: ({ row }) => {
                    const s = Math.round(row.original._score)
                    const t = tier(row.original._score)
                    return (
                        <div className="flex items-center gap-2">
                            <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-md border text-[11px] font-bold ${t.cls}`}
                            >
                                {t.label}
                            </span>
                            <span className="tabular-nums font-semibold">{s}</span>
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

    const { data, isLoading } = useGet<ListResponse<DriversType>>(
        SETTINGS_DRIVERS,
        {
            params: {
                search: search.driver_search,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )
    const { data: balances } = useGet<DriverBalance[]>(DRIVERS_BALANCE)
    const { data: metricsList } = useGet<DriverMetrics[]>(TRIPS_DRIVER_STATS)

    const rows = useMemo<DriverRow[]>(() => {
        const drivers = data?.results ?? []
        const balanceMap = new Map<number, number>(
            (balances ?? []).map((b) => [b.id, Number(b.balance) || 0]),
        )
        const metricsMap = new Map<number, DriverMetrics>(
            (metricsList ?? []).map((m) => [m.id, m]),
        )
        const enriched = drivers.map((d) => {
            const m = metricsMap.get(d.id)
            return {
                driver: d,
                balance: balanceMap.get(d.id) ?? 0,
                experience: Number(d.driver?.experience ?? 0),
                completed_trips: m?.completed_trips ?? 0,
                revenue: m?.revenue ?? 0,
                fuel_per_100km: m?.fuel_per_100km ?? 0,
                coverage: m?.coverage ?? 0,
                on_time_rate: m?.on_time_rate ?? 0,
            }
        })

        const balanceStats = meanStd(enriched.map((e) => e.balance))
        const revenueStats = meanStd(enriched.map((e) => e.revenue))
        const tripsStats = meanStd(enriched.map((e) => e.completed_trips))
        const fuelStats = meanStd(enriched.map((e) => e.fuel_per_100km))
        const coverageStats = meanStd(enriched.map((e) => e.coverage))
        const onTimeStats = meanStd(enriched.map((e) => e.on_time_rate))

        return enriched
            .map((e) => {
                const revenueZ = (e.revenue - revenueStats.m) / revenueStats.s
                const tripsZ = (e.completed_trips - tripsStats.m) / tripsStats.s
                // Fuel is reverse: lower l/100km is better
                const fuelZ = -(e.fuel_per_100km - fuelStats.m) / fuelStats.s
                const coverageZ = (e.coverage - coverageStats.m) / coverageStats.s
                const onTimeZ = (e.on_time_rate - onTimeStats.m) / onTimeStats.s
                const balanceZ = (e.balance - balanceStats.m) / balanceStats.s

                const compositeZ =
                    0.3 * revenueZ +
                    0.2 * tripsZ +
                    0.15 * fuelZ +
                    0.15 * coverageZ +
                    0.1 * onTimeZ +
                    0.1 * balanceZ
                const score = clamp(50 + compositeZ * 15, 0, 100)
                return {
                    ...e.driver,
                    _balance: e.balance,
                    _experience: e.experience,
                    _completed_trips: e.completed_trips,
                    _revenue: e.revenue,
                    _fuel_per_100km: e.fuel_per_100km,
                    _coverage: e.coverage,
                    _on_time_rate: e.on_time_rate,
                    _score: score,
                }
            })
            .sort((a, b) => b._score - a._score)
    }, [data?.results, balances, metricsList])

    const handleRowClick = (row: DriverRow) => {
        navigate({
            to: "/haydovchilar/$id",
            params: { id: row.id.toString() },
            search: {
                name: `${row.first_name} ${row.last_name}`.trim(),
            } as any,
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
