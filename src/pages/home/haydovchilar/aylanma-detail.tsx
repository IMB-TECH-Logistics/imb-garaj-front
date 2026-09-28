import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { DRIVERS_OVERVIEW } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
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
}

const num = (v: unknown) => Number(v ?? 0) || 0

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
    return d.toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
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
                        return <span className="text-amber-500">{t("form.tariff_no")}</span>
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
                    row.original.salary_given ? (
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

type PayoutForm = {
    amount_per_order: number | string | ""
    comment: string
}

function SalaryPayoutModal({
    driverId,
    tripId,
    pending,
    refetchKey,
}: {
    driverId: string
    tripId: string
    pending: OrderRow[]
    refetchKey: string
}) {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { closeModal, isOpen } = useModal("aylanma-pay-salary")

    const tariffed = useMemo(
        () => pending.filter((o) => o.salary_tariff_uzs != null),
        [pending],
    )
    const untariffedCount = pending.length - tariffed.length

    const tariffSum = useMemo(
        () =>
            tariffed.reduce(
                (acc, o) => acc + num(o.salary_tariff_uzs),
                0,
            ),
        [tariffed],
    )

    const form = useForm<PayoutForm>({
        defaultValues: {
            amount_per_order: "",
            comment: "",
        },
    })
    const { control, handleSubmit, reset, watch } = form
    const watchedAmount = watch("amount_per_order")
    const total = tariffSum + num(watchedAmount) * untariffedCount

    useEffect(() => {
        if (isOpen) {
            reset({ amount_per_order: "", comment: "" })
        }
    }, [isOpen, reset])

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("toast.advance_given"))
            qc.refetchQueries({ queryKey: [refetchKey] })
            qc.refetchQueries({
                predicate: (q) =>
                    typeof q.queryKey[0] === "string" &&
                    String(q.queryKey[0]).startsWith(
                        `${DRIVERS_OVERVIEW}/${driverId}`,
                    ),
            })
            closeModal()
        },
    })

    const onSubmit = (data: PayoutForm) => {
        const amt = Number(data.amount_per_order)
        if (untariffedCount > 0 && (!Number.isFinite(amt) || amt <= 0)) {
            toast.error(t("toast.error_amount"))
            return
        }
        mutate(`${DRIVERS_OVERVIEW}/${driverId}/trips/${tripId}/pay-salary`, {
            order_ids: pending.map((r) => r.id),
            ...(untariffedCount > 0 ? { amount_per_order: amt } : {}),
            comment: data.comment || null,
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="rounded-md bg-muted/40 border p-3 text-sm flex flex-col gap-1">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("page.selected_trip")}</span>
                    <span className="font-medium tabular-nums">
                        {pending.length} ta
                    </span>
                </div>
                {tariffed.length > 0 && (
                    <div className="flex justify-between text-emerald-600">
                        <span>Tarif bo‘yicha ({tariffed.length} ta, o‘zgartirilmaydi)</span>
                        <span className="font-medium tabular-nums">
                            {formatMoney(tariffSum)} UZS
                        </span>
                    </div>
                )}
                {untariffedCount > 0 && tariffed.length > 0 && (
                    <div className="text-[11px] text-amber-600">
                        {untariffedCount} ta reys uchun tarif sozlanmagan — summani kiriting.
                    </div>
                )}
            </div>

            {untariffedCount > 0 && (
                <FormNumberInput
                    required
                    control={control}
                    name="amount_per_order"
                    label={
                        tariffed.length > 0
                            ? `${t("form.amount_per_order")} (tarifsiz ${untariffedCount} ta)`
                            : t("form.amount_per_order")
                    }
                    placeholder="Ex: 500 000"
                    thousandSeparator=" "
                    decimalScale={0}
                />
            )}

            <FormTextarea
                methods={form}
                label={t("form.optional_comment")}
                name="comment"
            />

            <div className="rounded-md border border-dashed p-2 text-sm flex justify-between">
                <span className="text-muted-foreground">{t("form.expense")}</span>
                <span className="font-semibold tabular-nums">
                    {formatMoney(total)} UZS
                </span>
            </div>

            <div className="flex justify-end pt-1 gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    disabled={isPending}
                >
                    {t("actions.cancel")}
                </Button>
                <Button
                    type="submit"
                    loading={isPending}
                    className="min-w-32"
                >
                    {t("actions.confirm")}
                </Button>
            </div>
        </form>
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

    const [selectedRows, setSelectedRows] = useState<OrderRow[]>([])
    const { openModal } = useModal("aylanma-pay-salary")

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

    const pendingSelected = (selectedRows ?? []).filter((r) => !r.salary_given)

    const driverName = search?.name?.trim()
    const dateRange =
        search?.start || search?.end
            ? `${formatDate(search?.start)} → ${formatDate(search?.end)}`
            : null

    return (
        <div className="space-y-4 pb-6">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
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
                selecteds_row
                onSelectedRowsChange={setSelectedRows}
                head={
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium">{t("page.trips")}</h3>
                            <Badge>{orders?.length ?? 0}</Badge>
                        </div>
                        <Button
                            size="sm"
                            disabled={pendingSelected.length === 0}
                            onClick={openModal}
                        >
                            {t("actions.give_salary_btn")}
                            {pendingSelected.length > 0 &&
                                ` (${pendingSelected.length})`}
                        </Button>
                    </div>
                }
            />

            <Modal
                modalKey="aylanma-pay-salary"
                title={t("actions.give_salary_btn")}
                size="max-w-md"
            >
                <SalaryPayoutModal
                    driverId={id}
                    tripId={tripId}
                    pending={pendingSelected}
                    refetchKey={ordersUrl}
                />
            </Modal>
        </div>
    )
}
