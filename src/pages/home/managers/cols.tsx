import type React from "react"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowRight, MapPin } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { formatDateTime } from "@/lib/format-date"
import NoLocationBadge from "./no-location-badge"

const ACTIVITY_LABELS: Record<number, string> = {
    1: "trips.managers.on_trip",
    2: "status.in_garage",
    3: "status.repair",
    4: "status.idle_stop",
    5: "status.in_queue",
}

const ACTIVITY_COLORS: Record<number, string> = {
    1: "bg-green-500/10 text-green-600 border-transparent",
    2: "bg-blue-500/10 text-blue-600 border-transparent",
    3: "bg-orange-500/10 text-orange-600 border-transparent",
    4: "bg-red-500/10 text-red-600 border-transparent",
    5: "bg-yellow-500/10 text-yellow-600 border-transparent",
}

const EMPTY_RUN_COLOR = "bg-slate-500/10 text-slate-600 border-transparent dark:text-slate-300"

const REYS_STAGES: Record<number, { label: string; color: string }> = {
    0: { label: "trips.managers.stage_waiting", color: "bg-gray-500/10 text-gray-500 border-transparent" },
    1: { label: "trips.managers.stage_heading_to_load", color: "bg-sky-500/10 text-sky-600 border-transparent" },
    5: { label: "trips.managers.stage_loading", color: "bg-amber-500/10 text-amber-600 border-transparent" },
    6: { label: "trips.managers.stage_on_road", color: "bg-green-500/10 text-green-600 border-transparent" },
    7: { label: "trips.managers.stage_unloading", color: "bg-violet-500/10 text-violet-600 border-transparent" },
    2: { label: "trips.managers.stage_empty", color: "bg-gray-500/10 text-gray-500 border-transparent" },
    3: { label: "trips.managers.stage_empty", color: "bg-gray-500/10 text-gray-500 border-transparent" },
}

const ACTIVE_ORDER_STATUSES = [1, 5, 6, 7]

const sinceText = (value: string | null | undefined, t: (k: string, o?: any) => string) => {
    if (!value) return null
    const ms = Date.now() - new Date(value).getTime()
    if (isNaN(ms) || ms < 0) return null
    const total = Math.floor(ms / 60000)
    const d = Math.floor(total / 1440)
    const h = Math.floor((total % 1440) / 60)
    const m = total % 60
    if (d > 0) return t("trips.units.duration_dhm", { d, h, m })
    if (h > 0) return t("trips.units.duration_hm", { h, m })
    return t("trips.units.duration_m", { m })
}

const nextPending = (v: ManagerVehicles) =>
    v.pending_orders
        ? { from: v.next_loading_name, to: v.next_unloading_name, count: v.pending_orders }
        : null

export const useColumnsManagersVehicles = (onShowLocation: (vehicle: ManagerVehicles) => void) => {
    const { t } = useTranslation()

    return useMemo<ColumnDef<ManagerVehicles>[]>(
        () => [
            {
                accessorKey: "truck_number",
                header: t("table.truck_number"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{row.original.truck_number || "-"}</div>
                ),
            },
            {
                accessorKey: "model_name",
                header: t("table.model"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{row.original.model_name || "-"}</div>
                ),
            },
            {
                accessorKey: "driver_name",
                header: t("table.driver"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{row.original.driver_name || "-"}</div>
                ),
            },
            {
                accessorKey: "order_activity",
                header: t("table.truck_status"),
                enableSorting: true,
                cell: ({ row }) => {
                    const { order_activity: activity, order_type: type, order_status: status } = row.original
                    if (!activity) return <span className="text-muted-foreground">-</span>
                    const since = sinceText(row.original.order_status_since, t)
                    const withSince = (badge: React.ReactNode) => (
                        <div className="flex flex-col items-start gap-0.5">
                            {badge}
                            {since && <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">{since}</span>}
                        </div>
                    )
                    if (activity === 1) {
                        const stage = REYS_STAGES[status]
                        const emptyRun = type === 2 && ACTIVE_ORDER_STATUSES.includes(status)
                        return withSince(
                            <Badge
                                variant="outline"
                                className={`whitespace-nowrap ${emptyRun ? EMPTY_RUN_COLOR : stage?.color || ""}`}
                            >
                                {emptyRun ? t("trips.managers.empty_run") : stage?.label ? t(stage.label) : "-"}
                            </Badge>,
                        )
                    }
                    return withSince(
                        <Badge variant="outline" className={`whitespace-nowrap ${ACTIVITY_COLORS[activity] || ""}`}>
                            {ACTIVITY_LABELS[activity] ? t(ACTIVITY_LABELS[activity]) : "-"}
                        </Badge>,
                    )
                },
            },
            {
                accessorKey: "loading_name",
                header: t("trips.managers.direction_location"),
                enableSorting: false,
                cell: ({ row }) => {
                    const { loading_name, unloading_name } = row.original

                    if (loading_name && unloading_name) {
                        return (
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span>{loading_name}</span>
                                <ArrowRight size={14} className="text-muted-foreground" />
                                <span>{unloading_name}</span>
                            </div>
                        )
                    }

                    return <span className="text-muted-foreground">{loading_name || unloading_name || "-"}</span>
                },
            },
            {
                accessorKey: "expected_arrival",
                header: t("table.expected_arrival"),
                enableSorting: false,
                cell: ({ row }) => {
                    const { expected_arrival } = row.original
                    if (!expected_arrival) return <span className="text-muted-foreground">-</span>
                    return <span className="whitespace-nowrap">{formatDateTime(expected_arrival)}</span>
                },
            },
            {
                accessorKey: "pending_orders",
                header: t("table.pending_trips"),
                enableSorting: true,
                cell: ({ row }) => {
                    const next = nextPending(row.original)
                    if (!next) return <span className="text-muted-foreground">-</span>
                    return (
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span>{next.from || "-"}</span>
                            <ArrowRight size={14} className="text-muted-foreground" />
                            <span>{next.to || "-"}</span>
                            {next.count > 1 && (
                                <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">
                                    +{next.count - 1}
                                </Badge>
                            )}
                        </div>
                    )
                },
            },
            {
                id: "on_map",
                header: t("table.on_map"),
                enableSorting: false,
                cell: ({ row }) => (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onShowLocation(row.original)
                        }}
                        aria-label={t("table.on_map")}
                        title={t("table.on_map")}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                        <MapPin size={18} />
                    </button>
                ),
            },
            {
                accessorKey: "no_location_orders",
                header: t("table.no_location"),
                enableSorting: false,
                cell: ({ row }) => <NoLocationBadge count={row.original.no_location_orders} />,
            },
        ],
        [t, onShowLocation],
    )
}
