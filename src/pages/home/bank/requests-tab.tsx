import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { handleFormError } from "@/lib/show-form-errors"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Check, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export const BANK_REQUESTS = "checkout/bank/requests"
const DECISION = "checkout/bank/requests/decision"
const APPROVE_MODAL = "bank-request-approve"
const REJECT_MODAL = "bank-request-reject"

export type BankRequest = {
    key: string
    kind: "kontragent_out" | "kontragent_in" | "station_top_up" | "station_fuel"
    direction: "kirim" | "chiqim"
    date: string
    amount: string
    name: string
    inn: string
    vehicle: string | null
    comment: string | null
    executor: string | null
    amount_editable: boolean
}

export const useBankRequests = () =>
    useGet<{ count: number; results: BankRequest[] }>(BANK_REQUESTS, { options: { refetchInterval: 60_000 } })

const useRefresh = () => {
    const queryClient = useQueryClient()
    return () =>
        queryClient.invalidateQueries({
            predicate: (q) => {
                const key = String(q.queryKey[0])
                return key.startsWith("checkout/bank") || key.startsWith("kontragent") || key.includes("petrol-stations")
            },
        })
}

type ApproveValues = { amount: number | string; date: Date | string | null }

const ApproveForm = ({ req }: { req: BankRequest }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(APPROVE_MODAL)
    const refresh = useRefresh()
    const form = useForm<ApproveValues>({ defaultValues: { amount: Number(req.amount), date: new Date(req.date) } })
    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("bank_page.req.approved"))
            refresh()
            closeModal()
        },
        meta: { skipGlobalError: true },
    })
    const submit = (v: ApproveValues) =>
        mutate(
            DECISION,
            {
                key: req.key,
                approve: true,
                ...(req.amount_editable ?
                    { amount: Number(v.amount), date: v.date ? format(new Date(v.date), "yyyy-MM-dd") : null }
                :   {}),
            },
            { onError: (e: unknown) => handleFormError(e, form) },
        )
    return (
        <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(submit)}>
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm flex flex-col gap-0.5">
                <span className="font-medium">{req.name}</span>
                <span className="text-muted-foreground">{t(`bank_page.req.kind_${req.kind}`)}</span>
                {req.comment && <span className="text-xs text-muted-foreground break-words">{req.comment}</span>}
            </div>
            {req.amount_editable ?
                <>
                    <FormNumberInput
                        required
                        control={form.control}
                        name="amount"
                        label={t("bank_page.req.amount_paid")}
                        thousandSeparator=" "
                        decimalScale={2}
                        allowNegative={false}
                        registerOptions={{ validate: (v: unknown) => Number(v) > 0 || t("kassa.amount_gt_zero") }}
                    />
                    <FormDatePicker fullWidth label={t("bank_page.req.date_paid")} control={form.control} name="date" />
                </>
            :   <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span className="text-muted-foreground">{t("bank_page.amount")}</span>
                    <span className="font-semibold tabular-nums">{formatMoney(Number(req.amount))}</span>
                </div>
            }
            <p className="text-xs text-muted-foreground">{t("bank_page.req.approve_hint")}</p>
            <div className="flex justify-end">
                <Button className="min-w-32" type="submit" loading={isPending}>
                    <Check size={16} className="mr-1" />
                    {t("bank_page.req.approve")}
                </Button>
            </div>
        </form>
    )
}

const RejectForm = ({ req }: { req: BankRequest }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(REJECT_MODAL)
    const refresh = useRefresh()
    const form = useForm<{ comment: string }>({ defaultValues: { comment: "" } })
    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("bank_page.req.rejected"))
            refresh()
            closeModal()
        },
        meta: { skipGlobalError: true },
    })
    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) =>
                mutate(DECISION, { key: req.key, approve: false, comment: v.comment.trim() }, { onError: (e: unknown) => handleFormError(e, form) }),
            )}
        >
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm flex items-center justify-between gap-3">
                <span className="font-medium">{req.name}</span>
                <span className="tabular-nums font-semibold">{formatMoney(Number(req.amount))}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t(req.kind === "station_fuel" ? "bank_page.req.reject_fuel_hint" : "bank_page.req.reject_hint")}</p>
            <FormTextarea name="comment" label={t("bank_page.req.reject_reason")} methods={form} rows={3} />
            <div className="flex justify-end">
                <Button className="min-w-32" type="submit" variant="destructive" loading={isPending}>
                    <X size={16} className="mr-1" />
                    {t("bank_page.req.reject")}
                </Button>
            </div>
        </form>
    )
}

const BankRequestsTab = () => {
    const { t } = useTranslation()
    const { data, isLoading } = useBankRequests()
    const canDecide = useHasAction("bank_approve_control")
    const { openModal: openApprove, isOpen: approveOpen } = useModal(APPROVE_MODAL)
    const { openModal: openReject, isOpen: rejectOpen } = useModal(REJECT_MODAL)
    const [current, setCurrent] = useState<BankRequest | null>(null)
    useEffect(() => {
        if (!approveOpen && !rejectOpen) setCurrent(null)
    }, [approveOpen, rejectOpen])

    const columns = useMemo<ColumnDef<BankRequest>[]>(
        () => [
            {
                accessorKey: "date",
                header: t("bank_page.date"),
                cell: ({ row }) => <span className="whitespace-nowrap">{format(new Date(row.original.date), "dd/MM/yyyy HH:mm")}</span>,
            },
            {
                accessorKey: "kind",
                header: t("bank_page.kind"),
                cell: ({ row }) => (
                    <Badge
                        className={cn(
                            row.original.direction === "kirim" ?
                                "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                            :   "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10",
                            "whitespace-nowrap",
                        )}
                    >
                        {t(`bank_page.req.kind_${row.original.kind}`)}
                    </Badge>
                ),
            },
            {
                accessorKey: "amount",
                header: t("bank_page.amount"),
                cell: ({ row }) => (
                    <span
                        className={cn(
                            "tabular-nums font-medium whitespace-nowrap",
                            row.original.direction === "kirim" ? "text-emerald-600" : "text-rose-600",
                        )}
                    >
                        {row.original.direction === "kirim" ? "+" : "−"}
                        {formatMoney(Number(row.original.amount))}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: t("bank_page.source"),
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span>{row.original.name || "—"}</span>
                        {row.original.inn && <span className="text-xs text-muted-foreground">INN {row.original.inn}</span>}
                    </div>
                ),
            },
            {
                accessorKey: "vehicle",
                header: t("bank_page.vehicle"),
                cell: ({ row }) => <span className="whitespace-nowrap">{row.original.vehicle || "—"}</span>,
            },
            {
                accessorKey: "comment",
                header: t("bank_page.comment"),
                meta: { className: "min-w-[280px]" },
                cell: ({ row }) => <span className="block whitespace-normal break-words text-sm">{row.original.comment || "—"}</span>,
            },
            {
                accessorKey: "executor",
                header: t("bank_page.executor"),
                cell: ({ row }) => row.original.executor || "—",
            },
            ...(canDecide ?
                [
                    {
                        id: "decide",
                        header: "",
                        cell: ({ row }: { row: { original: BankRequest } }) => (
                            <div className="flex items-center gap-2 justify-end">
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setCurrent(row.original)
                                        openApprove()
                                    }}
                                >
                                    <Check size={14} className="mr-1" />
                                    {t("bank_page.req.approve")}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-rose-600"
                                    onClick={() => {
                                        setCurrent(row.original)
                                        openReject()
                                    }}
                                >
                                    <X size={14} />
                                </Button>
                            </div>
                        ),
                    } as ColumnDef<BankRequest>,
                ]
            :   []),
        ],
        [t, canDecide, openApprove, openReject],
    )

    return (
        <>
            <p className="text-sm text-muted-foreground mb-3">{t("bank_page.req.hint")}</p>
            <DataTable loading={isLoading} columns={columns} data={data?.results} numeration />
            <Modal title={t("bank_page.req.approve_title")} modalKey={APPROVE_MODAL} size="max-w-md">
                {current && <ApproveForm key={current.key} req={current} />}
            </Modal>
            <Modal title={t("bank_page.req.reject_title")} modalKey={REJECT_MODAL} size="max-w-md">
                {current && <RejectForm key={current.key} req={current} />}
            </Modal>
        </>
    )
}

export default BankRequestsTab
