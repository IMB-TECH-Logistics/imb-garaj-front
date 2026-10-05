import { Badge } from "@/components/ui/badge"
import { Banknote, Copy, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { STATUS_TRIP } from "../managers-trips/cols"
import { hasPriceDiff } from "./price-diff"
import { PaymentType } from "./payment-fields"
import type { EmptyLeg } from "./empty-leg-pay-modal"
import { useGet } from "@/hooks/useGet"
import { SETTINTS_PAYMENT_TYPE } from "@/constants/api-endpoints"

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

const EMPTY_RUN_COLOR = "bg-slate-500/10 text-slate-600 border-transparent dark:text-slate-300"

const isGarajOrTamirActivity = (activity?: number) =>
    activity === 2 || activity === 3

export const useColumnsManagersOrders = (opts?: {
    onImageClick?: (images: { id: number; image: string }[]) => void
    onLegPay?: (leg: EmptyLeg) => void
}) => {
    const { t } = useTranslation()
    const { data: paymentTypesData } = useGet<ListResponse<PaymentType>>(
        SETTINTS_PAYMENT_TYPE,
        { params: { page_size: 1000000 } },
    )
    return useMemo<ColumnDef<ManagerOrders>[]>(
        () => {
            const paymentTypeNames = new Map(
                (paymentTypesData?.results ?? []).map((p) => [p.id, p.name]),
            )
            const holatLabels: Record<number, string> = {
                1: t("table.status_loaded"),
                2: t("table.status_empty"),
            }
            return [
            {
                accessorKey: "date",
                header: t("table.created_at"),
                enableSorting: true,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDay(row.original.loading_time ?? row.original.date)}</span>,
            },
            {
                accessorKey: "activity_display",
                header: "Reys turi",
                enableSorting: false,
                cell: ({ row }) => {
                    const activity = row.original?.activity
                    const colorClass =
                        ACTIVITY_COLORS[activity] ||
                        "bg-gray-500/10 text-gray-500 border-gray-200"
                    const type = row.original?.type
                    const isLeg = !!(row.original as any).__leg
                    if (isLeg || (activity === 1 && type === 2)) {
                        return (
                            <Badge variant="outline" className={`whitespace-nowrap ${EMPTY_RUN_COLOR}`}>
                                Bo'sh yurish
                            </Badge>
                        )
                    }
                    return (
                        <Badge variant="outline" className={`whitespace-nowrap ${colorClass}`}>
                            {row.original?.activity_display || "-"}
                        </Badge>
                    )
                },
            },
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
                accessorKey: "status",
                header: "Reys holati",
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
            {
                id: "payment_type",
                header: t("form.payment_type"),
                size: 130,
                cell: ({ row }) => {
                    const names = [
                        ...new Set(
                            (row.original.incomes ?? [])
                                .map((i) => (i.payment_type ? paymentTypeNames.get(i.payment_type) : undefined))
                                .filter(Boolean),
                        ),
                    ]
                    if (!names.length) return <span className="text-muted-foreground">—</span>
                    return <span className="whitespace-nowrap">{names.join(", ")}</span>
                },
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
                            className="inline-flex items-center gap-1 cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(String(extId))
                                toast.success(`${extId} nusxaga olindi`)
                            }}
                        >
                            <Copy width={14} className="shrink-0" />
                            {extId}
                        </span>
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
                accessorKey: "cargo_type_name",
                header: "Mahsulot turi",
                enableSorting: true,
                cell: ({ row }) => <span className="whitespace-nowrap">{row.original.cargo_type_name || "—"}</span>,
            },
            {
                accessorKey: "pending_time",
                header: t("table.start_time"),
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatMoment(row.original.loading_time ?? row.original.pending_time)}</span>,
            },
            {
                accessorKey: "completed_time",
                header: t("table.end_time"),
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatMoment(row.original.completed_time)}</span>,
            },
            {
                id: "duration",
                header: t("table.duration"),
                size: 130,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatDuration(row.original.loading_time ?? row.original.pending_time, row.original.completed_time)}
                    </span>
                ),
            },
            {
                id: "distance",
                header: "Masofa",
                size: 90,
                cell: ({ row }) => {
                    const leg = (row.original as any).__leg as EmptyLeg | undefined
                    if (!leg) return <span className="text-muted-foreground">—</span>
                    const km = leg.km ?? leg.distance_km
                    const manual = leg.distance_km_manual != null
                    return (
                        <span
                            className="whitespace-nowrap tabular-nums"
                            title={manual ? `GPS: ${leg.distance_km != null ? formatMoney(leg.distance_km) : "—"} km` : undefined}
                        >
                            {km != null ? <>{formatMoney(km)} km{manual ? " *" : ""}</> : "—"}
                        </span>
                    )
                },
            },
            {
                id: "empty_leg_pay",
                header: "Bo'sh yurish to'lovi",
                size: 150,
                cell: ({ row }) => {
                    const leg = (row.original as any).__leg as EmptyLeg | undefined
                    if (!leg) return <span className="text-muted-foreground">—</span>
                    const amount = leg.payment_amount != null ? Number(leg.payment_amount) : null
                    return (
                        <div className="flex items-center gap-2 not-italic">
                            {amount != null && (
                                <span className="whitespace-nowrap font-medium text-green-600 tabular-nums">
                                    {formatMoney(amount)}
                                </span>
                            )}
                            {opts?.onLegPay && leg.id != null && (
                                <button
                                    type="button"
                                    disabled={leg.locked}
                                    title={leg.locked ? "Aylanma yopilgan, o'zgartirib bo'lmaydi" : "Bo'sh yurish to'lovi"}
                                    className="text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-40"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        opts.onLegPay?.(leg)
                                    }}
                                >
                                    <Banknote size={16} />
                                </button>
                            )}
                        </div>
                    )
                },
            },
            {
                accessorKey: "loading_time",
                header: "Yuklashga",
                size: 120,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDuration(row.original.loading_time, row.original.in_transit_time)}</span>,
            },
            {
                accessorKey: "in_transit_time",
                header: "Yo'lga",
                size: 120,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDuration(row.original.in_transit_time, row.original.unloading_time)}</span>,
            },
            {
                accessorKey: "unloading_time",
                header: "Tushirishga",
                size: 120,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDuration(row.original.unloading_time, row.original.completed_time)}</span>,
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
                accessorKey: "canceled_time",
                header: t("status.cancelled"),
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatMoment(row.original.canceled_time)}</span>,
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
            ]
        },
        [opts?.onImageClick, opts?.onLegPay, t, paymentTypesData],
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

    if (days > 0) return `${days} kun ${hours} s. ${minutes} min`
    if (hours > 0) return `${hours} s. ${minutes} min`
    return `${minutes} min`
}

const formatMoment = (value?: string) => {
    if (!value) return "-"
    const date = new Date(value)
    if (isNaN(date.getTime())) return "-"
    return format(date, "dd/MM HH:mm")
}

const formatDay = (value?: string) => {
    if (!value) return "-"
    const date = new Date(value)
    if (isNaN(date.getTime())) return "-"
    return format(date, "dd/MM")
}
