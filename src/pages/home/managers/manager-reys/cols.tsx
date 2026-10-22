import { Badge } from "@/components/ui/badge"
import { Banknote, Copy, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import i18n from "@/i18n/i18n"
import { STATUS_TRIP } from "../managers-trips/cols"
import { hasPriceDiff } from "./price-diff"
import { PaymentType } from "./payment-fields"
import type { EmptyLeg } from "./empty-leg-pay-modal"
import type { ExtraPayTarget } from "./extra-pay-modal"
import { useGet } from "@/hooks/useGet"
import { SETTINTS_PAYMENT_TYPE } from "@/constants/api-endpoints"
import { formatFuel } from "@/pages/home/route-norms/format"

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

const STATUS_COLORS: Record<number, string> = {
    0: "bg-slate-500/10 text-slate-600 border-transparent dark:text-slate-300",
    1: "bg-sky-500/10 text-sky-600 border-transparent",
    5: "bg-amber-500/10 text-amber-600 border-transparent",
    6: "bg-blue-500/10 text-blue-600 border-transparent",
    7: "bg-violet-500/10 text-violet-600 border-transparent",
    2: "bg-green-500/10 text-green-600 border-transparent",
    3: "bg-red-500/10 text-red-600 border-transparent",
    4: "bg-zinc-500/10 text-zinc-500 border-transparent",
}

const EMPTY_RUN_COLOR = "bg-slate-500/10 text-slate-600 border-transparent dark:text-slate-300"

const isGarajOrTamirActivity = (activity?: number) =>
    activity === 2 || activity === 3

export const useColumnsManagersOrders = (opts?: {
    onImageClick?: (images: { id: number; image: string }[]) => void
    onLegPay?: (leg: EmptyLeg) => void
    onExtraPay?: (target: ExtraPayTarget) => void
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
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDay(row.original.ordered_at ?? row.original.loading_time ?? row.original.date)}</span>,
            },
            {
                accessorKey: "activity_display",
                header: t("form.trip_type"),
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
                                {t("trips.managers.empty_run")}
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
                    if (isGarajOrTamirActivity(row.original?.activity) || (row.original as any).__idle) {
                        return <span className="text-muted-foreground">—</span>
                    }
                    return <div>{row.original.unloading_name || "-"}</div>
                },
            },
            {
                accessorKey: "status",
                header: t("trips.reys_cols.trip_status"),
                enableSorting: true,
                cell: ({ row }) => {
                    const status = row.original?.status
                    if (row.original?.activity === 4) return "-"
                    if (status === -1) {
                        return (
                            <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 border-transparent"
                            >
                                {t("reys_confirm.short")}
                            </Badge>
                        )
                    }
                    const statusBadge = STATUS_TRIP[status] ? (
                        <Badge variant="outline" className={`whitespace-nowrap ${STATUS_COLORS[status] ?? ""}`}>
                            {t(STATUS_TRIP[status])}
                        </Badge>
                    ) : "-"
                    const canceledAt = row.original?.logistics_canceled_at
                    const logisticsBadge = canceledAt ? (
                        <Badge
                            variant="outline"
                            title={t("trips.reys_cols.logistics_canceled_hint", { date: format(new Date(canceledAt), "dd.MM.yyyy HH:mm") })}
                            className="whitespace-nowrap bg-red-500/10 text-red-600 border-transparent"
                        >
                            {t("trips.reys_cols.logistics_canceled")}
                        </Badge>
                    ) : null
                    if (logisticsBadge) {
                        return (
                            <div className="flex flex-wrap items-center gap-1">
                                {statusBadge}
                                {logisticsBadge}
                            </div>
                        )
                    }
                    return statusBadge
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
                                toast.success(t("trips.reys_cols.copied", { id: extId }))
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
                header: t("trips.reys_cols.product_type"),
                enableSorting: true,
                cell: ({ row }) => {
                    const isEmptyRun = !!(row.original as any).__leg || row.original.type === 2
                    return (
                        <span className="whitespace-nowrap">
                            {isEmptyRun ? t("trips.managers.no_cargo") : row.original.cargo_type_name || "—"}
                        </span>
                    )
                },
            },
            {
                accessorKey: "pending_time",
                header: t("table.start_time"),
                size: 150,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatMoment(startOf(row.original))}</span>,
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
                        {formatDuration(startOf(row.original), row.original.completed_time)}
                    </span>
                ),
            },
            {
                id: "distance",
                header: t("form.distance"),
                size: 90,
                cell: ({ row }) => {
                    const legs = legsOf(row.original)
                    if (!legs.length) {
                        const km = row.original.distance_km
                        return km != null ? (
                            <span className="whitespace-nowrap tabular-nums">{formatMoney(Math.round(Number(km)))} {t("trips.units.km")}</span>
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )
                    }
                    const known = legs.map((l) => l.km ?? l.distance_km).filter((v): v is number => v != null)
                    const km = known.length ? known.reduce((sum, v) => sum + Number(v), 0) : null
                    const manual = legs.some((l) => l.distance_km_manual != null)
                    const gps = legs.map((l) => (l.distance_km != null ? formatMoney(Math.round(Number(l.distance_km))) : "—")).join(" + ")
                    return (
                        <span
                            className="whitespace-nowrap tabular-nums"
                            title={manual ? `GPS: ${gps} ${t("trips.units.km")}` : undefined}
                        >
                            {km != null ? <>{formatMoney(Math.round(Number(km)))} {t("trips.units.km")}{manual ? " *" : ""}</> : "—"}
                        </span>
                    )
                },
            },
            {
                id: "fuel",
                header: t("trips.reys_cols.fuel"),
                size: 100,
                cell: ({ row }) => {
                    const r = row.original as any
                    if (r.__idle) return <span className="text-muted-foreground">—</span>
                    const legs = legsOf(row.original)
                    const parts = [...legs, ...(r.__leg ? [] : [row.original])]
                    const state = parts.find((p) => p.fuel_state)?.fuel_state
                    const estimated = state === "pending"
                    const known = parts.map((p) => p.fuel_amount).filter((v): v is number => v != null)
                    if (!known.length) {
                        return (
                            <span className="text-muted-foreground" title={estimated ? t("trips.fuel.pending") : undefined}>
                                —
                            </span>
                        )
                    }
                    const amount = known.reduce((sum, v) => sum + Number(v), 0)
                    const fuelType = parts.find((p) => p.fuel_type)?.fuel_type
                    const unreliable = parts.some((p) => p.fuel_state === "unreliable")
                    return (
                        <span
                            className={`whitespace-nowrap tabular-nums${unreliable ? " text-amber-600" : ""}${estimated ? " text-muted-foreground" : ""}`}
                            title={unreliable ? t("trips.fuel.check") : estimated ? t("trips.fuel.estimated") : undefined}
                        >
                            {estimated ? "≈ " : ""}
                            {formatFuel(t, fuelType, amount)}
                        </span>
                    )
                },
            },
            {
                id: "empty_leg_pay",
                header: t("trips.reys_cols.extra_pay"),
                size: 150,
                cell: ({ row }) => {
                    const r = row.original as any
                    const payButton = (title: string, disabled: boolean, onClick: () => void) => (
                        <button
                            type="button"
                            disabled={disabled}
                            title={disabled ? t("trips.reys_cols.trip_locked") : title}
                            className="text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={(e) => {
                                e.stopPropagation()
                                onClick()
                            }}
                        >
                            <Banknote size={16} />
                        </button>
                    )
                    const amountOf = (value: unknown) =>
                        value != null && Number(value) > 0 ? (
                            <span className="whitespace-nowrap font-medium text-green-600 tabular-nums">
                                {formatMoney(Number(value))}
                            </span>
                        ) : null

                    if (r.__idle) {
                        const leg = r.__idleLeg as EmptyLeg | undefined
                        if (!leg) return <span className="text-muted-foreground">—</span>
                        return (
                            <div className="flex items-center gap-2" title={leg.idle_payment_comment ?? undefined}>
                                {amountOf(leg.idle_payment_amount)}
                                {opts?.onExtraPay && leg.id != null &&
                                    payButton(t("trips.reys_cols.idle_pay"), !!leg.locked || !!leg.salary_paid_at, () =>
                                        opts.onExtraPay?.({
                                            kind: "idle",
                                            id: leg.id as number,
                                            title: t("trips.reys_cols.idle_pay"),
                                            route: leg.from_place || "—",
                                            amount: leg.idle_payment_amount,
                                            comment: leg.idle_payment_comment,
                                        }),
                                    )}
                            </div>
                        )
                    }

                    const legs = legsOf(row.original)
                    const isOrder = !r.__leg && (r.activity === 1 || r.activity === 4)
                    if (!legs.length && !isOrder) return <span className="text-muted-foreground">—</span>
                    return (
                        <div className="flex flex-col gap-1 not-italic">
                            {legs.map((leg) => {
                                if (r.__merged && isOrder && !(Number(leg.payment_amount) > 0)) return null
                                const route = `${leg.from_place || t("trips.empty_leg.turnover_start")} → ${leg.to_place || "—"}`
                                return (
                                    <div key={leg.id ?? leg.before_order ?? leg.start} className="flex items-center gap-2">
                                        {amountOf(leg.payment_amount)}
                                        {opts?.onLegPay && leg.id != null &&
                                            payButton(
                                                legs.length > 1
                                                    ? `${t("trips.reys_cols.empty_run_pay")}: ${route}`
                                                    : t("trips.reys_cols.empty_run_pay"),
                                                !!leg.locked || !!leg.salary_paid_at,
                                                () => opts.onLegPay?.(leg),
                                            )}
                                    </div>
                                )
                            })}
                            {isOrder && (
                                <div className="flex items-center gap-2" title={r.extra_pay_comment ?? undefined}>
                                    {amountOf(r.extra_pay_amount)}
                                    {opts?.onExtraPay &&
                                        payButton(t("trips.reys_cols.extra_pay_title"), !!r.extra_pay_paid_at, () =>
                                            opts.onExtraPay?.({
                                                kind: "order",
                                                id: r.id,
                                                title: t("trips.reys_cols.extra_pay_title"),
                                                route: r.activity === 4
                                                    ? `${r.loading_name ?? "—"} — ${t("status.idle_stop")}`
                                                    : `${r.loading_name ?? "—"} → ${r.unloading_name ?? "—"}`,
                                                amount: r.extra_pay_amount,
                                                comment: r.extra_pay_comment,
                                            }),
                                        )}
                                </div>
                            )}
                        </div>
                    )
                },
            },
            {
                accessorKey: "loading_time",
                header: t("trips.reys_cols.to_loading"),
                size: 120,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDuration(row.original.loading_time, row.original.in_transit_time)}</span>,
            },
            {
                accessorKey: "in_transit_time",
                header: t("trips.reys_cols.to_road"),
                size: 120,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDuration(row.original.in_transit_time, row.original.unloading_time)}</span>,
            },
            {
                accessorKey: "unloading_time",
                header: t("trips.reys_cols.to_unloading"),
                size: 120,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDuration(row.original.unloading_time, row.original.completed_time)}</span>,
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
        [opts?.onImageClick, opts?.onLegPay, opts?.onExtraPay, t, paymentTypesData],
    )
}

const legsOf = (r: ManagerOrders): EmptyLeg[] => {
    const row = r as any
    return row.__legs ?? (row.__leg ? [row.__leg] : [])
}

const startOf = (r: ManagerOrders) => (r as any).__start ?? r.loading_time ?? r.pending_time

const formatDuration = (start?: string, end?: string) => {
    if (!start || !end) return "-"

    const ms = new Date(end).getTime() - new Date(start).getTime()

    if (isNaN(ms) || ms < 0) return "-"

    const totalMinutes = Math.floor(ms / 60000)
    const days = Math.floor(totalMinutes / 1440)
    const hours = Math.floor((totalMinutes % 1440) / 60)
    const minutes = totalMinutes % 60

    if (days > 0) return i18n.t("trips.units.duration_dhm", { d: days, h: hours, m: minutes })
    if (hours > 0) return i18n.t("trips.units.duration_hm", { h: hours, m: minutes })
    return i18n.t("trips.units.duration_m", { m: minutes })
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
