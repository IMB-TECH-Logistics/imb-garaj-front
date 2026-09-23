import { Badge } from "@/components/ui/badge"
import { ImageIcon } from "lucide-react"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { STATUS_TRIP } from "../managers-trips/cols"

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
            },
            {
                accessorKey: "external_id",
                header: t("table.cargo_id"),
                size: 120,
                cell: ({ row }) => {
                    const extId = row.original.external_id
                    if (!extId) return <span className="text-muted-foreground">—</span>
                    return (
                        <Badge variant="outline" className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                            {extId}
                        </Badge>
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
                        <Badge variant="outline" className={colorClass}>
                            {row.original?.activity_display || "-"}
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

                    if (moneyUsd) {
                        return <div>{formatMoney(moneyUsd)} USD</div>
                    }

                    if (moneyUzs) {
                        return <div>{formatMoney(moneyUzs)} UZS</div>
                    }

                    return "-"
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
                accessorKey: "pending_time",
                header: t("table.start_time"),
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.pending_time)}</span>,
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
                accessorKey: "completed_time",
                header: t("table.end_time"),
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.completed_time)}</span>,
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
                    return <div>{STATUS_TRIP[status] || "-"}</div>
                },
            },
            ]
        },
        [opts?.onImageClick, t],
    )
}

const formatDateSafe = (value?: string) => {
    if (!value) return "-"

    const date = new Date(value)

    if (isNaN(date.getTime())) return "-"

    return format(date, "yyyy-MM-dd HH:mm")
}
