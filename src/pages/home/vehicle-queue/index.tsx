import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { MONITORING_VEHICLE_QUEUE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatDateTime } from "@/lib/format-date"
import { cn } from "@/lib/utils"
import { STATUS_TRIP } from "@/pages/home/managers/managers-trips/cols"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

type QueueOrder = {
    id: number
    external_id: string | null
    status: number
    loading: string | null
    unloading: string | null
    client: string | null
    date: string | null
    ordered_at: string | null
    expected_free_at: string | null
}

type QueueRow = {
    id: number
    truck_number: string
    trailer_number: string | null
    driver: string | null
    driver_phone: string | null
    state: "reys" | "navbat" | "remont" | "garaj" | "prastoy" | "bosh"
    state_since: string | null
    current: QueueOrder | null
    queue: QueueOrder[]
    expected_free_at: string | null
}

const STATE_LABELS: Record<QueueRow["state"], string> = {
    reys: "trips.managers.on_trip",
    navbat: "status.in_queue",
    remont: "status.repair",
    garaj: "status.in_garage",
    prastoy: "status.idle_stop",
    bosh: "trips.managers.state_free",
}

const STATE_COLORS: Record<QueueRow["state"], string> = {
    reys: "bg-green-500/10 text-green-600 border-transparent",
    navbat: "bg-yellow-500/10 text-yellow-600 border-transparent",
    remont: "bg-orange-500/10 text-orange-600 border-transparent",
    garaj: "bg-blue-500/10 text-blue-600 border-transparent",
    prastoy: "bg-red-500/10 text-red-600 border-transparent",
    bosh: "bg-slate-500/10 text-slate-600 border-transparent dark:text-slate-300",
}

const FREE_STATES = new Set<QueueRow["state"]>(["bosh", "garaj", "prastoy"])

const route = (o: QueueOrder) => `${o.loading ?? "—"} → ${o.unloading ?? "—"}`

const sortRows = (rows: QueueRow[]) =>
    [...rows].sort((a, b) => {
        const af = FREE_STATES.has(a.state) ? 0 : 1
        const bf = FREE_STATES.has(b.state) ? 0 : 1
        if (af !== bf) return af - bf
        const at = a.expected_free_at ? new Date(a.expected_free_at).getTime() : Infinity
        const bt = b.expected_free_at ? new Date(b.expected_free_at).getTime() : Infinity
        if (at !== bt) return at - bt
        return a.truck_number.localeCompare(b.truck_number)
    })

export default function VehicleQueuePage() {
    const { t } = useTranslation()
    const { data, isLoading } = useGet<QueueRow[]>(MONITORING_VEHICLE_QUEUE, {
        options: { refetchInterval: 60_000 },
    })
    const rows = useMemo(() => sortRows(data ?? []), [data])

    const columns = useMemo<ColumnDef<QueueRow>[]>(
        () => [
            {
                header: t("vq.vehicle"),
                accessorKey: "truck_number",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="whitespace-nowrap font-medium">{row.original.truck_number}</span>
                        {row.original.trailer_number && (
                            <span className="whitespace-nowrap text-xs text-muted-foreground">{row.original.trailer_number}</span>
                        )}
                    </div>
                ),
            },
            {
                header: t("vq.driver"),
                accessorKey: "driver",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="whitespace-nowrap">{row.original.driver || "—"}</span>
                        {row.original.driver_phone && (
                            <span className="whitespace-nowrap text-xs text-muted-foreground">{row.original.driver_phone}</span>
                        )}
                    </div>
                ),
            },
            {
                header: t("vq.state"),
                accessorKey: "state",
                cell: ({ row }) => (
                    <div className="flex flex-col items-start gap-0.5">
                        <Badge variant="outline" className={cn("whitespace-nowrap", STATE_COLORS[row.original.state])}>
                            {t(STATE_LABELS[row.original.state])}
                        </Badge>
                        {row.original.state_since && (
                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                                {t("vq.since", { date: formatDateTime(row.original.state_since) })}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                header: t("vq.current"),
                id: "current",
                cell: ({ row }) => {
                    const o = row.original.current
                    if (!o) return <span className="text-muted-foreground">—</span>
                    return (
                        <div className="flex flex-col">
                            <span className="whitespace-nowrap">{route(o)}</span>
                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                                {[o.client, STATUS_TRIP[o.status] ? t(STATUS_TRIP[o.status]) : null].filter(Boolean).join(" · ")}
                            </span>
                        </div>
                    )
                },
            },
            {
                header: t("vq.queue"),
                id: "queue",
                cell: ({ row }) => {
                    const queue = row.original.queue
                    if (!queue.length) return <span className="text-muted-foreground">—</span>
                    return (
                        <ol className="flex flex-col gap-0.5">
                            {queue.map((o, i) => (
                                <li key={o.id} className="whitespace-nowrap text-sm">
                                    {i + 1}. {route(o)}
                                    {o.client && <span className="text-muted-foreground"> · {o.client}</span>}
                                </li>
                            ))}
                        </ol>
                    )
                },
            },
            {
                header: t("vq.free_at"),
                accessorKey: "expected_free_at",
                cell: ({ row }) => {
                    const value = row.original.expected_free_at
                    if (!value) return <span className="text-muted-foreground">—</span>
                    const overdue = new Date(value).getTime() < Date.now()
                    return (
                        <span className={cn("whitespace-nowrap", overdue && "text-destructive")}>
                            {formatDateTime(value)}
                        </span>
                    )
                },
            },
        ],
        [t],
    )

    return (
        <DataTable
            loading={isLoading}
            numeration
            data={rows}
            columns={columns}
            head={
                <div className="flex items-center gap-2 p-3">
                    <h1 className="text-base font-medium">{t("nav.vehicle_queue")}</h1>
                    <Badge>{rows.length}</Badge>
                </div>
            }
        />
    )
}
