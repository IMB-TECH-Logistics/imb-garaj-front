import { Badge } from "@/components/ui/badge"
import { Copy, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { STATUS_TRIP } from "../managers-trips/cols"
import { hasPriceDiff } from "./price-diff"

const HOLAT_COLORS: Record<number, string> = {
    1: "bg-green-500/10 text-green-600 border-transparent",
    2: "bg-gray-500/10 text-gray-500 border-transparent",
}

const ACTIVITY_COLORS: Record<number, string> = {
    1: "bg-green-500/10 text-green-600 border-transparent",
    2: "bg-blue-500/10 text-blue-600 border-transparent",
    3: "bg-orange-500/10 text-orange-600 border-transparent",
    4: "bg-red-500/10 text-red-600 border-transparent",
    5: "bg-yellow-500/10 text-yellow-600 border-transparent",
}

const DIRECTION_MATCH_COLORS = {
    priced: "bg-green-500/10 text-green-600 border-transparent whitespace-nowrap",
    unpriced: "bg-amber-500/10 text-amber-600 border-transparent whitespace-nowrap",
    ambiguous: "bg-orange-500/10 text-orange-600 border-transparent whitespace-nowrap",
    not_found: "bg-red-500/10 text-red-600 border-transparent whitespace-nowrap",
    manual: "bg-blue-500/10 text-blue-600 border-transparent whitespace-nowrap",
}

const isGarajOrTamirActivity = (activity?: number) =>
    activity === 2 || activity === 3

export const useColumnsManagersOrders = (opts?: {
    onImageClick?: (images: { id: number; image: string }[]) => void
}) => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<ManagerOrders>[]>(
        () => {
            const holatLabels: Record<number, string> = {
                1: t("table.status_loaded"),
                2: t("table.status_empty"),
            }
            return [
            {
                accessorKey: "loading_name",
                header: t("form.loading_location"),
                enableSorting: true,
                cell: ({ row }) => {
                    if (isGarajOrTamirActivity(row.original?.activity)) {
                        return <span className="text-muted-foreground">—</span>
                    }
                    return <div>{row.original.loading_name || "-"}</div>
                },
            },
            {
                accessorKey: "unloading_name",
                header: t("form.unloading_location"),
                enableSorting: true,
                cell: ({ row }) => {
                    if (isGarajOrTamirActivity(row.original?.activity)) {
                        return <span className="text-muted-foreground">—</span>
                    }
                    return <div>{row.original.unloading_name || "-"}</div>
                },
            },
            {
                accessorKey: "cargo_type_name",
                header: t("form.cargo_type"),
                enableSorting: true,
                cell: ({ row }) => <span className="whitespace-nowrap">{row.original.cargo_type_name || "—"}</span>,
            },
            {
                accessorKey: "external_id",
                header: t("table.cargo_id"),
                size: 120,
                cell: ({ row }) => {
                    const extId = row.original.external_id
                    if (!extId) return <span className="text-muted-foreground">—</span>
                    return (
                        <span
                            className="group inline-flex items-center gap-1 cursor-pointer transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(String(extId))
                                toast.success(`${extId} nusxaga olindi`)
                            }}
                        >
                            {extId}
                            <Copy width={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
                        </span>
                    )
                },
            },
            {
                accessorKey: "date",
                header: t("table.created_at"),
                enableSorting: true,
                cell: ({ row }) => formatDateSafe(row.original.date),
            },
            {
                accessorKey: "activity_display",
                header: t("table.status"),
                enableSorting: false,
                cell: ({ row }) => {
                    const activity = row.original?.activity
                    const colorClass =
                        ACTIVITY_COLORS[activity] ||
                        "bg-gray-500/10 text-gray-500 border-gray-200"
                    return (
                        <Badge variant="outline" className={`whitespace-nowrap ${colorClass}`}>
                            {row.original?.activity_display || "-"}
                        </Badge>
                    )
                },
            },
            {
                id: "direction_match",
                header: t("form.direction"),
                enableSorting: false,
                cell: ({ row }) => {
                    const match = row.original?.direction_match
                    if (!match) return null
                    const name = row.original?.direction_name || undefined
                    if (match === "matched" || match === "created") {
                        const priced = match === "matched" && row.original?.direction_has_price
                        return priced ? (
                            <Badge variant="outline" title={name} className={DIRECTION_MATCH_COLORS.priced}>
                                {t("form.dm_has_price")}
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                title={t("form.dm_unpriced_hint")}
                                className={DIRECTION_MATCH_COLORS.unpriced}
                            >
                                {t("form.dm_unpriced")}
                            </Badge>
                        )
                    }
                    if (match === "manual") {
                        return (
                            <Badge variant="outline" title={name} className={DIRECTION_MATCH_COLORS.manual}>
                                {t("form.dm_manual")}
                            </Badge>
                        )
                    }
                    if (match === "ambiguous") {
                        return (
                            <Badge variant="outline" className={DIRECTION_MATCH_COLORS.ambiguous}>
                                {t("form.dm_ambiguous")}
                            </Badge>
                        )
                    }
                    return (
                        <Badge variant="outline" className={DIRECTION_MATCH_COLORS.not_found}>
                            {t("form.dm_not_found")}
                        </Badge>
                    )
                },
            },
            {
                accessorKey: "type",
                header: t("table.status"),
                enableSorting: true,
                cell: ({ row }) => {
                    const type = row.original?.type
                    const colorClass = HOLAT_COLORS[type] || "bg-gray-500/10 text-gray-500 border-gray-200"
                    return (
                        <Badge variant="outline" className={colorClass}>
                            {holatLabels[type] || "-"}
                        </Badge>
                    )
                },
            },
            {
                accessorKey: "payment_amount_uzs",
                header: `${t("form.income")} (uzs / usd)`,
                enableSorting: true,
                cell: ({ row }) => {
                    const moneyUzs = row.original?.payment_amount_uzs
                    const moneyUsd = row.original?.payment_amount_usd
                    const diff = Number(row.original?.price_diff ?? 0)
                    const diffBadge =
                        hasPriceDiff(row.original) && diff !== 0 ? (
                            <Badge
                                variant="outline"
                                title={t("form.price_diff")}
                                className={
                                    diff < 0
                                        ? "bg-red-500/10 text-red-600 border-transparent"
                                        : "bg-green-500/10 text-green-600 border-transparent"
                                }
                            >
                                {t("form.price_diff")}: {formatMoney(diff)}
                            </Badge>
                        ) : null

                    if (moneyUsd) {
                        return <div className="flex items-center gap-1">{formatMoney(moneyUsd)} USD {diffBadge}</div>
                    }

                    if (moneyUzs) {
                        return <div className="flex items-center gap-1">{formatMoney(moneyUzs)} UZS {diffBadge}</div>
                    }

                    return diffBadge ?? "-"
                },
            },
            {
                id: "images",
                header: t("table.image_col"),
                size: 60,
                cell: ({ row }) => {
                    const images = row.original?.images
                    if (!images?.length) return <span className="text-muted-foreground">—</span>
                    return (
                        <button
                            type="button"
                            className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation()
                                opts?.onImageClick?.(images)
                            }}
                        >
                            <ImageIcon size={16} />
                            <span className="text-xs">{images.length}</span>
                        </button>
                    )
                },
            },
            {
                accessorKey: "logistics_distributor_code",
                header: t("form.company_code"),
                size: 110,
                cell: ({ row }) => row.original.logistics_distributor_code || <span className="text-muted-foreground">—</span>,
            },
            {
                accessorKey: "pending_time",
                header: t("table.start_time"),
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.pending_time)}</span>,
            },
            {
                accessorKey: "completed_time",
                header: t("table.end_time"),
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.completed_time)}</span>,
            },
            {
                id: "duration",
                header: t("table.duration"),
                size: 130,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatDuration(row.original.pending_time, row.original.completed_time)}
                    </span>
                ),
            },
            {
                accessorKey: "loading_time",
                header: t("table.loading"),
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.loading_time)}</span>,
            },
            {
                accessorKey: "in_transit_time",
                header: t("status.transit"),
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.in_transit_time)}</span>,
            },
            {
                accessorKey: "unloading_time",
                header: t("table.unloading_short"),
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.unloading_time)}</span>,
            },
            {
                accessorKey: "canceled_time",
                header: t("status.cancelled"),
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.canceled_time)}</span>,
            },
            {
                accessorKey: "archived_time",
                header: t("status.archived"),
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.archived_time)}</span>,
            },
            {
                accessorKey: "status",
                header: t("table.status"),
                enableSorting: true,
                cell: ({ row }) => {
                    const status = row.original?.status
                    if (status === -1) {
                        return (
                            <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 border-transparent"
                            >
                                Tasdiqlanmagan
                            </Badge>
                        )
                    }
                    return <div>{STATUS_TRIP[status] || "-"}</div>
                },
            },
            ]
        },
        [opts?.onImageClick, t],
    )
}

const formatDuration = (start?: string, end?: string) => {
    if (!start || !end) return "-"

    const ms = new Date(end).getTime() - new Date(start).getTime()

    if (isNaN(ms) || ms < 0) return "-"

    const totalMinutes = Math.floor(ms / 60000)
    const days = Math.floor(totalMinutes / 1440)
    const hours = Math.floor((totalMinutes % 1440) / 60)
    const minutes = totalMinutes % 60

    if (days > 0) return `${days} kun ${hours} soat`
    if (hours > 0) return `${hours} soat ${minutes} daq`
    return `${minutes} daq`
}

const formatDateSafe = (value?: string) => {
    if (!value) return "-"

    const date = new Date(value)

    if (isNaN(date.getTime())) return "-"

    return format(date, "yyyy-MM-dd HH:mm")
}
