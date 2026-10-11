import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Muted } from "./cols"
import {
    EMPTY_VALUE,
    formatDate,
    formatDateTime,
    formatDuration,
    formatKm,
    formatNumber,
    fuelUnit,
} from "./format"
import { RouteNormOrder } from "./types"

const Dash = () => <span className="text-muted-foreground">{EMPTY_VALUE}</span>

export const useOrderColumns = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<RouteNormOrder>[]>(
        () => [
            {
                header: t("route_norms.cols.date"),
                id: "finished_at",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {row.original.finished_at ?
                            formatDateTime(row.original.finished_at)
                        :   formatDate(row.original.date)}
                    </span>
                ),
            },
            {
                header: t("route_norms.cols.driver"),
                id: "driver",
                cell: ({ row }) => (
                    <span className="block max-w-48 truncate">
                        {row.original.driver?.name ?? EMPTY_VALUE}
                    </span>
                ),
            },
            {
                header: t("route_norms.cols.vehicle"),
                id: "vehicle",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {row.original.vehicle?.number ?? EMPTY_VALUE}
                    </span>
                ),
            },
            {
                header: t("route_norms.cols.distance"),
                id: "distance_km",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatKm(t, row.original.distance_km)}
                    </span>
                ),
            },
            {
                header: t("route_norms.cols.total_time"),
                id: "total_minutes",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatDuration(t, row.original.total_minutes)}
                    </span>
                ),
            },
            {
                header: t("route_norms.cols.moving"),
                id: "moving_minutes",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatDuration(t, row.original.moving_minutes)}
                    </span>
                ),
            },
            {
                header: t("route_norms.cols.stopped"),
                id: "stop_minutes",
                cell: ({ row }) => {
                    const { stop_minutes, stops_count, longest_stop_minutes } =
                        row.original
                    return (
                        <div>
                            <div className="whitespace-nowrap">
                                {formatDuration(t, stop_minutes)}
                            </div>
                            {!!stops_count && (
                                <Muted>
                                    {t("route_norms.stops_detail", {
                                        count: stops_count,
                                        longest: formatDuration(
                                            t,
                                            longest_stop_minutes,
                                        ),
                                    })}
                                </Muted>
                            )}
                        </div>
                    )
                },
            },
            {
                header: t("route_norms.cols.load_time"),
                id: "load_minutes",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatDuration(t, row.original.load_minutes)}
                    </span>
                ),
            },
            {
                header: t("route_norms.cols.unload_time"),
                id: "unload_minutes",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatDuration(t, row.original.unload_minutes)}
                    </span>
                ),
            },
            {
                header: t("route_norms.cols.fuel"),
                id: "fuel",
                cell: ({ row }) => {
                    const { fuel_state, fuel_amount, fuel_per_100km, fuel_type } =
                        row.original
                    if (fuel_state === "pending") {
                        return (
                            <span className="text-muted-foreground whitespace-nowrap">
                                {t("route_norms.fuel_pending")}
                            </span>
                        )
                    }
                    if (
                        fuel_state === "no_data" ||
                        fuel_amount === null ||
                        fuel_amount === undefined
                    ) {
                        return <Dash />
                    }
                    const unit = fuelUnit(t, fuel_type)
                    return (
                        <div>
                            <div className="whitespace-nowrap">
                                {formatNumber(fuel_amount)} {unit}
                                {fuel_per_100km !== null &&
                                    fuel_per_100km !== undefined && (
                                        <span className="text-muted-foreground">
                                            {" "}
                                            ({formatNumber(fuel_per_100km)} /{" "}
                                            {t("route_norms.per_100km")})
                                        </span>
                                    )}
                            </div>
                            {fuel_state === "unreliable" && (
                                <Muted>{t("route_norms.fuel_check")}</Muted>
                            )}
                        </div>
                    )
                },
            },
            {
                header: t("route_norms.cols.status"),
                id: "status",
                cell: ({ row }) => {
                    const { in_norm, issues } = row.original
                    if (in_norm) return null
                    const reasons = issues.filter(
                        (code) => code !== "fuel_km_from_gps",
                    )
                    if (!reasons.length) return null
                    return (
                        <div className="space-y-0.5 text-xs text-muted-foreground min-w-40">
                            {reasons.map((code) => (
                                <div key={code}>
                                    {t(`route_norms.issues.${code}`)}
                                </div>
                            ))}
                        </div>
                    )
                },
            },
        ],
        [t],
    )
}
