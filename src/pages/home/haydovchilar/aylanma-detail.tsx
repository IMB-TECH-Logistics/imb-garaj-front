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

const ORDER_STATUS_LABEL: Record<
    number,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
    0: { label: "Kutilmoqda", variant: "secondary" },
    1: { label: "Boshlandi", variant: "outline" },
    2: { label: "Yakunlandi", variant: "default" },
    3: { label: "Bekor qilindi", variant: "destructive" },
    4: { label: "Arxivlandi", variant: "secondary" },
    5: { label: "Yuklanmoqda", variant: "outline" },
    6: { label: "Yo’lda", variant: "outline" },
    7: { label: "Tushirilmoqda", variant: "outline" },
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

const useOrderCols = () =>
    useMemo<ColumnDef<OrderRow>[]>(
        () => [
            {
                header: "Yo’nalish",
                id: "route",
                cell: ({ row }) => (
                    <span className="block break-words">
                        {row.original.loading_name || "—"} →{" "}
                        {row.original.unloading_name || "—"}
                    </span>
                ),
            },
            {
                header: "Sana",
                accessorKey: "date",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatDate(row.original.date)}
                    </span>
                ),
            },
            {
                header: "Yuk turi",
                accessorKey: "cargo_type_name",
                cell: ({ row }) => row.original.cargo_type_name || "—",
            },
            {
                header: "Status",
                accessorKey: "status",
                cell: ({ row }) => {
                    const s = ORDER_STATUS_LABEL[row.original.status]
                    return s ? (
                        <Badge variant={s.variant}>{s.label}</Badge>
                    ) : (
                        "—"
                    )
                },
            },
            {
                header: "Summa (UZS)",
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
                header: "Tarif (UZS)",
                accessorKey: "salary_tariff_uzs",
                cell: ({ row }) => {
                    const v = row.original.salary_tariff_uzs
                    if (v == null)
                        return <span className="text-amber-500">tarif yo‘q</span>
                    return (
                        <span className="tabular-nums">{formatMoney(num(v))}</span>
                    )
                },
            },
            {
                header: "Oylik",
                id: "salary_status",
                cell: ({ row }) => {
                    const paid = num(row.original.salary_paid_uzs)
                    if (row.original.salary_given) {
                        return (
                            <div className="flex flex-col">
                                <Badge className="bg-green-500/15 text-green-500 hover:bg-green-500/20 w-fit">
                                    Berildi
                                </Badge>
                                {paid > 0 && (
                                    <span className="text-[11px] text-muted-foreground tabular-nums">
                                        {formatMoney(paid)} UZS
                                    </span>
                                )}
                            </div>
                        )
                    }
                    return (
                        <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/20 w-fit">
                            Berilmadi
                        </Badge>
                    )
                },
            },
        ],
        [],
    )

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
    const qc = useQueryClient()
    const { closeModal, isOpen } = useModal("aylanma-pay-salary")

    const sameTariff = useMemo(() => {
        if (pending.length === 0) return null
        const first = pending[0]?.salary_tariff_uzs
        if (first == null) return null
        const allSame = pending.every(
            (o) => Number(o.salary_tariff_uzs) === Number(first),
        )
        return allSame ? Number(first) : null
    }, [pending])

    const tariffSum = useMemo(
        () =>
            pending.reduce(
                (acc, o) => acc + num(o.salary_tariff_uzs),
                0,
            ),
        [pending],
    )
    const hasMissingTariff = pending.some((o) => o.salary_tariff_uzs == null)

    const form = useForm<PayoutForm>({
        defaultValues: {
            amount_per_order: sameTariff ?? "",
            comment: "",
        },
    })
    const { control, handleSubmit, reset, watch, setValue } = form
    const watchedAmount = watch("amount_per_order")
    const total = num(watchedAmount) * pending.length

    useEffect(() => {
        if (isOpen) {
            reset({ amount_per_order: sameTariff ?? "", comment: "" })
        }
    }, [isOpen, sameTariff, reset])

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success("Oylik berildi")
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
        if (!Number.isFinite(amt) || amt <= 0) {
            toast.error("To’g’ri summa kiriting")
            return
        }
        mutate(`${DRIVERS_OVERVIEW}/${driverId}/trips/${tripId}/pay-salary`, {
            order_ids: pending.map((r) => r.id),
            amount_per_order: amt,
            comment: data.comment || null,
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="rounded-md bg-muted/40 border p-3 text-sm flex flex-col gap-1">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Tanlangan reys</span>
                    <span className="font-medium tabular-nums">
                        {pending.length} ta
                    </span>
                </div>
                {sameTariff != null ? (
                    <div className="flex justify-between text-emerald-600">
                        <span>Sozlangan tariff (mos)</span>
                        <span className="font-medium tabular-nums">
                            {formatMoney(sameTariff)} UZS
                        </span>
                    </div>
                ) : tariffSum > 0 ? (
                    <div className="flex justify-between text-amber-600">
                        <span>Sozlangan tariflar yig‘indisi (turli)</span>
                        <span className="font-medium tabular-nums">
                            {formatMoney(tariffSum)} UZS
                        </span>
                    </div>
                ) : null}
                {hasMissingTariff && (
                    <div className="text-[11px] text-amber-600">
                        Ba’zi reyslar uchun tarif sozlanmagan.
                    </div>
                )}
            </div>

            <FormNumberInput
                required
                control={control}
                name="amount_per_order"
                label="Har bir reys uchun summa (UZS)"
                placeholder="Ex: 500 000"
                thousandSeparator=" "
                decimalScale={0}
            />

            {sameTariff != null && Number(watchedAmount) !== sameTariff && (
                <button
                    type="button"
                    className="text-[12px] text-primary text-left underline"
                    onClick={() =>
                        setValue("amount_per_order", sameTariff as any)
                    }
                >
                    Tarif summasidan foydalanish ({formatMoney(sameTariff)})
                </button>
            )}

            <FormTextarea
                methods={form}
                label="Izoh (ixtiyoriy)"
                name="comment"
            />

            <div className="rounded-md border border-dashed p-2 text-sm flex justify-between">
                <span className="text-muted-foreground">Jami chiqim</span>
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
                    Bekor qilish
                </Button>
                <Button
                    type="submit"
                    loading={isPending}
                    className="min-w-32"
                >
                    Tasdiqlash
                </Button>
            </div>
        </form>
    )
}

export default function AylanmaDetail() {
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
    const { data: orders, isLoading } = useGet<OrderRow[]>(ordersUrl, {
        enabled: !!tripId,
    })

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
                        Aylanma (ID:{tripId})
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
                            <h3 className="font-medium">Reyslar</h3>
                            <Badge>{orders?.length ?? 0}</Badge>
                        </div>
                        <Button
                            size="sm"
                            disabled={pendingSelected.length === 0}
                            onClick={openModal}
                        >
                            Oylik berish
                            {pendingSelected.length > 0 &&
                                ` (${pendingSelected.length})`}
                        </Button>
                    </div>
                }
            />

            <Modal
                modalKey="aylanma-pay-salary"
                title="Oylik berish"
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
