import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ImageIcon } from "lucide-react"
import { useMemo } from "react"
import { STATUS_TRIP } from "../managers-trips/cols"

const HOLAT_LABELS: Record<number, string> = {
    1: "Yukli",
    2: "Yuksiz",
}

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
    return useMemo<ColumnDef<ManagerOrders>[]>(
        () => [
            {
                accessorKey: "loading_name",
                header: "Yuklash joyi",
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
                header: "Tushirish joyi",
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
                header: "Yuk turi",
                enableSorting: true,
            },
            {
                accessorKey: "date",
                header: "Yaratilagan sana",
                enableSorting: true,
            },
            {
                accessorKey: "activity_display",
                header: "Holat",
                enableSorting: true,
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
                header: "Holati",
                enableSorting: true,
                cell: ({ row }) => {
                    const type = row.original?.type
                    const colorClass = HOLAT_COLORS[type] || "bg-gray-500/10 text-gray-500 border-gray-200"
                    return (
                        <Badge variant="outline" className={colorClass}>
                            {HOLAT_LABELS[type] || "-"}
                        </Badge>
                    )
                },
            },
            {
                accessorKey: "payment_amount_uzs",
                header: "Tushum (uzs / usd)",
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
                header: "Rasm",
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
                header: "Pending vaqt",
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.pending_time)}</span>,
            },
            {
                accessorKey: "started_time",
                header: "Boshlangan vaqt",
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.started_time)}</span>,
            },
            {
                accessorKey: "loading_time",
                header: "Yuklash vaqti",
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.loading_time)}</span>,
            },
            {
                accessorKey: "in_transit_time",
                header: "Yo'lda",
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.in_transit_time)}</span>,
            },
            {
                accessorKey: "unloading_time",
                header: "Tushirish vaqti",
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.unloading_time)}</span>,
            },
            {
                accessorKey: "completed_time",
                header: "Yakunlangan",
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.completed_time)}</span>,
            },
            {
                accessorKey: "canceled_time",
                header: "Bekor qilingan",
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.canceled_time)}</span>,
            },
            {
                accessorKey: "archived_time",
                header: "Arxivlangan",
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSafe(row.original.archived_time)}</span>,
            },
            {
                accessorKey: "status",
                header: "Status",
                enableSorting: true,
                cell: ({ row }) => {
                    const status = row.original?.status
                    return <div>{STATUS_TRIP[status] || "-"}</div>
                },
            },
        ],
        [opts?.onImageClick],
    )
}

const formatDateSafe = (value?: string) => {
    if (!value) return "-"

    const date = new Date(value)

    if (isNaN(date.getTime())) return "-"

    return format(date, "yyyy-MM-dd HH:mm")
}
