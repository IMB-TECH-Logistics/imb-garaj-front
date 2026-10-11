import { ColumnDef } from "@tanstack/react-table"
import { TFunction } from "i18next"
import { ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
    EMPTY_VALUE,
    formatDuration,
    formatDurationRange,
    formatFuel,
    formatKm,
    formatKmRange,
    fuelLabel,
} from "./format"
import { FuelStat, PointRef, RouteNorm } from "./types"

export const Muted = ({ children }: { children: ReactNode }) => (
    <div className="text-xs text-muted-foreground whitespace-nowrap">
        {children}
    </div>
)

export const PointCell = ({ point }: { point: PointRef | null }) => {
    if (!point) {
        return <span className="text-muted-foreground">{EMPTY_VALUE}</span>
    }
    return (
        <div className="max-w-56">
            <div className="font-medium truncate" title={point.name}>
                {point.name}
            </div>
            {!!point.parent_name && (
                <div
                    className="text-xs text-muted-foreground truncate"
                    title={point.parent_name}
                >
                    {point.parent_name}
                </div>
            )}
        </div>
    )
}

const hasStats = (row: RouteNorm) => row.trips_count > 0

const Dash = () => <span className="text-muted-foreground">{EMPTY_VALUE}</span>

const FuelLines = ({
    t,
    items,
    pick,
}: {
    t: TFunction
    items: FuelStat[]
    pick: (item: FuelStat) => number | null
}) => {
    if (!items.length) return <Dash />
    return (
        <div className="space-y-0.5 whitespace-nowrap">
            {items.map((item) => (
                <div key={item.fuel_type}>
                    {fuelLabel(t, item.fuel_type)}{" "}
                    {formatFuel(t, item.fuel_type, pick(item))}
                </div>
            ))}
        </div>
    )
}

export const useRouteNormColumns = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<RouteNorm>[]>(
        () => [
            {
                header: t("route_norms.cols.load_point"),
                accessorKey: "load_point",
                enableSorting: true,
                cell: ({ row }) => <PointCell point={row.original.load_point} />,
            },
            {
                header: t("route_norms.cols.unload_point"),
                accessorKey: "unload_point",
                enableSorting: true,
                cell: ({ row }) => (
                    <PointCell point={row.original.unload_point} />
                ),
            },
            {
                header: t("route_norms.cols.trips"),
                accessorKey: "trips_count",
                enableSorting: true,
                cell: ({ row }) => {
                    const { trips_count, trips_total, enough } = row.original
                    return (
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="font-medium tabular-nums">
                                {trips_count}
                            </span>
                            {trips_total !== trips_count && (
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    / {trips_total}
                                </span>
                            )}
                            {!enough && (
                                <span className="text-xs bg-muted text-muted-foreground py-0.5 px-2 rounded-sm">
                                    {t("route_norms.few_data")}
                                </span>
                            )}
                        </div>
                    )
                },
            },
            {
                header: t("route_norms.cols.drivers"),
                accessorKey: "drivers_count",
                enableSorting: false,
            },
            {
                header: t("route_norms.cols.distance"),
                accessorKey: "distance_km",
                enableSorting: true,
                cell: ({ row }) => {
                    const stat = row.original.distance_km
                    if (!hasStats(row.original) || !stat) return <Dash />
                    const range = formatKmRange(stat.min, stat.max)
                    return (
                        <div>
                            <div className="whitespace-nowrap">
                                {formatKm(t, stat.median)}
                            </div>
                            {range && <Muted>{range}</Muted>}
                        </div>
                    )
                },
            },
            {
                header: t("route_norms.cols.total_time"),
                accessorKey: "total_minutes",
                enableSorting: true,
                cell: ({ row }) => {
                    const stat = row.original.total_minutes
                    if (!hasStats(row.original) || !stat) return <Dash />
                    const range = formatDurationRange(t, stat.min, stat.max)
                    return (
                        <div>
                            <div className="whitespace-nowrap">
                                {formatDuration(t, stat.median)}
                            </div>
                            {range && <Muted>{range}</Muted>}
                        </div>
                    )
                },
            },
            {
                header: t("route_norms.cols.moving"),
                accessorKey: "moving_minutes",
                enableSorting: false,
                cell: ({ row }) =>
                    hasStats(row.original) ?
                        <span className="whitespace-nowrap">
                            {formatDuration(
                                t,
                                row.original.moving_minutes?.median,
                            )}
                        </span>
                    :   <Dash />,
            },
            {
                header: t("route_norms.cols.stopped"),
                accessorKey: "stop_minutes",
                enableSorting: false,
                cell: ({ row }) =>
                    hasStats(row.original) ?
                        <span className="whitespace-nowrap">
                            {formatDuration(
                                t,
                                row.original.stop_minutes?.median,
                            )}
                        </span>
                    :   <Dash />,
            },
            {
                header: t("route_norms.cols.fuel_per_100km"),
                id: "fuel_per_100km",
                enableSorting: false,
                cell: ({ row }) => (
                    <FuelLines
                        t={t}
                        items={row.original.fuel}
                        pick={(item) => item.per_100km_median}
                    />
                ),
            },
            {
                header: t("route_norms.cols.fuel_per_trip"),
                id: "fuel_amount",
                enableSorting: false,
                cell: ({ row }) => (
                    <FuelLines
                        t={t}
                        items={row.original.fuel}
                        pick={(item) => item.amount_median}
                    />
                ),
            },
        ],
        [t],
    )
}
