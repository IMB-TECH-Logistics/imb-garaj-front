import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { DRIVERS_OVERVIEW } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

type OrderRow = {
    id: number
    loading: number | null
    unloading: number | null
    loading_name: string
    unloading_name: string
    cargo_type_name: string
    date: string
    status: number
    payment_amount_uzs: string | number
    payment_amount_usd: string | number
    salary_paid_uzs: string | number
    salary_given: boolean
    salary_tariff_uzs: string | number | null
    salary_tariff_missing?: boolean
}

const num = (v: unknown) => Number(v ?? 0) || 0
const plainMoney = (v: number) =>
    Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")

const ORDER_STATUS_KEY: Record<number, string> = {
    0: "status.pending",
    1: "status.started",
    2: "status.done",
    3: "status.cancelled",
    4: "status.archived",
    5: "status.loading_status",
    6: "status.transit",
    7: "status.unloading_status",
}

function formatDate(s?: string | null) {
    if (!s) return "—"
    const d = new Date(s)
    if (isNaN(d.getTime())) return s
    return format(d, "dd/MM/yyyy")
}

const useOrderCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<OrderRow>[]>(
        () => [
            {
                header: t("form.direction"),
                id: "route",
                cell: ({ row }) => (
                    <span className="block break-words">
                        {row.original.loading_name || "—"} →{" "}
                        {row.original.unloading_name || "—"}
                    </span>
                ),
            },
            {
                header: t("form.date"),
                accessorKey: "date",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatDate(row.original.date)}
                    </span>
                ),
            },
            {
                header: t("form.cargo_type"),
                accessorKey: "cargo_type_name",
                cell: ({ row }) => row.original.cargo_type_name || "—",
            },
            {
                header: t("table.status"),
                accessorKey: "status",
                cell: ({ row }) => {
                    const key = ORDER_STATUS_KEY[row.original.status]
                    return key ? (
                        <Badge>{t(key)}</Badge>
                    ) : (
                        "—"
                    )
                },
            },
            {
                header: t("table.trip_price_uzs"),
                accessorKey: "payment_amount_uzs",
                cell: ({ row }) => {
                    const v = num(row.original.payment_amount_uzs)
                    return v > 0 ? (
                        <span className="text-green-500 font-medium whitespace-nowrap">
                            {formatMoney(v)}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )
                },
            },
            {
                header: t("table.tariff_uzs"),
                accessorKey: "salary_tariff_uzs",
                cell: ({ row }) => {
                    const v = row.original.salary_tariff_uzs
                    if (v == null)
                        return (
                            <Badge variant="destructive" className="w-fit whitespace-nowrap">
                                {t("form.tariff_no")}
                            </Badge>
                        )
                    return (
                        <span className="tabular-nums">{formatMoney(num(v))}</span>
                    )
                },
            },
            {
                header: t("table.monthly_salary"),
                accessorKey: "salary_paid_uzs",
                cell: ({ row }) => {
                    const paid = num(row.original.salary_paid_uzs)
                    return paid > 0 ? (
                        <span className="tabular-nums">{formatMoney(paid)}</span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )
                },
            },
            {
                header: t("table.status"),
                id: "salary_status",
                cell: ({ row }) =>
                    num(row.original.salary_paid_uzs) <= 0 && !row.original.salary_given ? (
                        <span className="text-muted-foreground">—</span>
                    ) : row.original.salary_given ? (
                        <Badge className="bg-green-500/15 text-green-500 hover:bg-green-500/20 w-fit">
                            {t("status.given")}
                        </Badge>
                    ) : (
                        <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/20 w-fit">
                            {t("status.not_given")}
                        </Badge>
                    ),
            },
        ],
        [t],
    )
}



export default function AylanmaDetail() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { id, tripId } = useParams({ strict: false }) as {
        id: string
        tripId: string
    }
    const search = useSearch({ strict: false }) as {
        name?: string
        start?: string
        end?: string
    }


    const ordersUrl = `${DRIVERS_OVERVIEW}/${id}/trips/${tripId}/orders`
    const { data: rawOrders, isLoading } = useGet<OrderRow[]>(ordersUrl, {
        enabled: !!tripId,
    })

    const orders = useMemo(() => {
        if (!rawOrders) return []
        const from = search?.start ? new Date(search.start) : null
        const to = search?.end ? new Date(search.end) : null
        if (!from && !to) return rawOrders
        return rawOrders.filter((o) => {
            const d = new Date(o.date)
            return (!from || d >= from) && (!to || d <= to)
        })
    }, [rawOrders, search?.start, search?.end])

    const orderCols = useOrderCols()


    const driverName = search?.name?.trim()
    const dateRange =
        search?.start || search?.end
            ? `${formatDate(search?.start)} → ${formatDate(search?.end)}`
            : null

    return (
        <div className="space-y-4 pb-6">
            <div className="flex items-center gap-3">
                <Button
                    variant="default"
                    size="icon"
                    onClick={() =>
                        navigate({
                            to: "/haydovchilar/$id",
                            params: { id },
                            search: driverName
                                ? ({ name: driverName } as any)
                                : undefined,
                        })
                    }
                    className="shrink-0"
                >
                    <ArrowLeft size={18} />
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-semibold leading-tight">
                        {t("page.turnover_detail")} (ID:{tripId})
                    </h1>
                    <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        {driverName && <span>{driverName}</span>}
                        {driverName && dateRange && <span>·</span>}
                        {dateRange && (
                            <span className="tabular-nums">{dateRange}</span>
                        )}
                    </div>
                </div>
            </div>

            <DataTable
                loading={isLoading}
                columns={orderCols}
                data={orders ?? []}
                numeration
                viewAll
                head={
                    <div className="mb-3 flex items-center gap-2">
                        <h3 className="font-medium">{t("page.trips")}</h3>
                        <Badge>{orders?.length ?? 0}</Badge>
                    </div>
                }
            />
        </div>
    )
}
