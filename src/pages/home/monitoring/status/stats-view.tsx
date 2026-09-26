import { DataTable } from "@/components/ui/datatable"
import { MONITORING_LOGISTICS_STATS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { orderStatusMeta } from "../order-card"
import { IDLE, type VehicleRow } from "./data"

type StatsOrder = {
    id: string
    external_id: string
    vehicle: number | null
    truck_number: string | null
    from: string | null
    to: string | null
    status: number
    garage_status: number | null
    started_at: string | null
    spent_minutes: number | null
    status_minutes: Record<string, number>
    distance_km: number | null
}

type StatsResponse = {
    available: boolean
    synced_at: string | null
    vehicles: { id: number; has_gps: boolean }[]
    orders: Omit<StatsOrder, "id">[]
}

const none = <span className="text-muted-foreground">—</span>

const STATUS_COLUMNS: { status: number; garage: number }[] = [
    { status: 50, garage: 1 },
    { status: 60, garage: 5 },
    { status: 70, garage: 5 },
    { status: 80, garage: 6 },
    { status: 90, garage: 7 },
]

const FINISH = 100

function Truck({ value }: { value: string | null }) {
    return <span className="whitespace-nowrap font-mono text-base font-bold tracking-wider">{value ?? "—"}</span>
}

export default function StatsView({ onSelect }: { onSelect: (v: VehicleRow) => void }) {
    const { t } = useTranslation()
    const duration = useCallback(
        (value: number | null | undefined) => {
            if (value == null) return "—"
            const total = Math.round(value)
            if (total < 1) return t("monitoring_stats.less_minute")
            const h = Math.floor(total / 60)
            return h ? t("monitoring_stats.hours_minutes", { h, m: total % 60 }) : t("monitoring_stats.minutes", { m: total })
        },
        [t],
    )
    const search = useSearch({ strict: false }) as Record<string, string>
    const q = (search.q ?? "").trim().toLowerCase()
    const today = new Date()
    const from = search.from_date ? new Date(search.from_date) : startOfMonth(today)
    const to = search.to_date ? new Date(search.to_date) : endOfMonth(today)
    const [selected, setSelected] = useState<number[]>([])

    const { data, isLoading } = useGet<StatsResponse>(MONITORING_LOGISTICS_STATS, {
        params: { from_date: format(from, "yyyy-MM-dd"), to_date: format(to, "yyyy-MM-dd") },
        options: { staleTime: 60 * 1000 },
    })

    const allOrders = useMemo(() => {
        const withGps = new Set((data?.vehicles ?? []).filter((v) => v.has_gps).map((v) => v.id))
        const hasGps = (vehicle: number | null) => (vehicle != null && withGps.has(vehicle) ? 0 : 1)
        return (data?.orders ?? [])
            .map((o) => ({ ...o, id: o.external_id }))
            .sort((a, b) => hasGps(a.vehicle) - hasGps(b.vehicle))
    }, [data])
    const trucks = useMemo(() => {
        const seen = new Map<number, string>()
        for (const o of allOrders) {
            if (o.vehicle != null && !seen.has(o.vehicle)) seen.set(o.vehicle, o.truck_number ?? "—")
        }
        return [...seen].map(([id, truck_number]) => ({ id, truck_number })).sort((a, b) => a.truck_number.localeCompare(b.truck_number))
    }, [allOrders])
    const orders = allOrders.filter(
        (o) =>
            (!selected.length || (o.vehicle != null && selected.includes(o.vehicle))) &&
            (!q || (o.truck_number ?? "").toLowerCase().includes(q) || o.external_id.toLowerCase().includes(q)),
    )

    const toggle = (id: number) =>
        setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

    const orderColumns = useMemo<ColumnDef<StatsOrder>[]>(
        () => [
            {
                id: "started_at",
                accessorFn: (r) => r.started_at ?? "",
                header: t("monitoring_stats.date"),
                size: 110,
                cell: ({ row }) => (
                    <div className="whitespace-nowrap">
                        <div>{row.original.started_at ? format(parseISO(row.original.started_at), "dd.MM.yyyy") : "—"}</div>
                        <div className="font-mono text-xs text-muted-foreground">#{row.original.external_id}</div>
                    </div>
                ),
            },
            {
                id: "truck",
                accessorFn: (r) => r.truck_number ?? "",
                header: t("monitoring_stats.order"),
                size: 110,
                cell: ({ row }) => <Truck value={row.original.truck_number} />,
            },
            {
                id: "route",
                accessorFn: (r) => `${r.from ?? ""} ${r.to ?? ""}`,
                header: t("monitoring_stats.route"),
                cell: ({ row }) =>
                    row.original.from && row.original.to ? (
                        <span>{`${row.original.from} → ${row.original.to}`}</span>
                    ) : (
                        <span className="text-muted-foreground">{t("monitoring_stats.unknown_route")}</span>
                    ),
            },
            ...STATUS_COLUMNS.map<ColumnDef<StatsOrder>>((col) => ({
                id: `status_${col.status}`,
                accessorFn: (r) => r.status_minutes[String(col.status)] ?? -1,
                size: 90,
                header: () => (
                    <span className="inline-flex items-center gap-1.5 leading-tight">
                        <span aria-hidden className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: orderStatusMeta(col.garage).color }} />
                        {t(`monitoring_stats.status_${col.status}`)}
                    </span>
                ),
                cell: ({ row }) => {
                    const value = row.original.status_minutes[String(col.status)]
                    const current = row.original.status === col.status
                    if (value == null) return none
                    return (
                        <span className={cn("whitespace-nowrap tabular-nums", current && "font-semibold text-primary")}>
                            {duration(value)}
                        </span>
                    )
                },
            })),
            {
                id: "total",
                accessorFn: (r) => r.spent_minutes ?? -1,
                header: t("monitoring_stats.total_time"),
                size: 105,
                cell: ({ row }) => {
                    const o = row.original
                    const meta = orderStatusMeta(o.garage_status)
                    return (
                        <div className="whitespace-nowrap tabular-nums">
                            <div className="font-semibold">{duration(o.spent_minutes)}</div>
                            {o.status !== FINISH && (
                                <div className="text-xs font-semibold" style={{ color: meta.color }}>
                                    {t(`monitoring_stats.status_${o.status}`, { defaultValue: meta.label })}
                                </div>
                            )}
                        </div>
                    )
                },
            },
            {
                id: "distance",
                accessorFn: (r) => r.distance_km ?? -1,
                header: t("monitoring_stats.total_km"),
                size: 90,
                cell: ({ row }) =>
                    row.original.distance_km != null ? (
                        <span className="whitespace-nowrap font-semibold tabular-nums">{row.original.distance_km.toFixed(1)} km</span>
                    ) : (
                        none
                    ),
            },
        ],
        [t, duration],
    )

    if (data && !data.available) {
        return <p className="py-10 text-center text-sm text-muted-foreground">{t("monitoring_stats.not_linked")}</p>
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("monitoring_stats.vehicle")}>
                <span className="mr-1 text-xs text-muted-foreground">{t("monitoring_stats.vehicle")}:</span>
                <button
                    type="button"
                    onClick={() => setSelected([])}
                    className={cn(
                        "h-8 rounded-full border px-3 text-xs font-semibold transition",
                        !selected.length ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
                    )}
                >
                    {t("monitoring_stats.all")}
                </button>
                {trucks.map((v) => (
                    <button
                        key={v.id}
                        type="button"
                        aria-pressed={selected.includes(v.id)}
                        onClick={() => toggle(v.id)}
                        className={cn(
                            "h-8 rounded-full border px-3 font-mono text-xs font-bold tracking-wider transition",
                            selected.includes(v.id) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
                        )}
                    >
                        {v.truck_number}
                    </button>
                ))}
                <span className="ml-auto text-[11px] text-muted-foreground">{t("monitoring_stats.orders_count", { count: orders.length })}</span>
                {data?.synced_at && (
                    <span className="text-[11px] text-muted-foreground">
                        {t("monitoring_stats.synced", { time: format(parseISO(data.synced_at), "dd.MM HH:mm") })}
                    </span>
                )}
            </div>

            <DataTable
                columns={orderColumns}
                data={orders}
                loading={isLoading}
                numeration
                onRowClick={(o) =>
                    o.vehicle != null &&
                    onSelect({ id: o.vehicle, truck_number: o.truck_number ?? "—", driver_name: "—", type: "—", current_status: IDLE })
                }
            />
        </div>
    )
}
