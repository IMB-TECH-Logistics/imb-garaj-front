import { ParamCombobox } from "@/components/as-params/combobox"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    WAREHOUSE_DEBT_PAYMENTS,
    WAREHOUSE_DEBTS,
    WAREHOUSE_MY_DEBT,
} from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney, formatNumber } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { Wallet } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type {
    OmborSearchParams,
    WhDebtHistoryRow,
    WhDebtPayment,
    WhDebtor,
    WhMyDebt,
} from "./types"
import { collectErrors, fmtDate, toNumber, todayISO } from "./utils"

const PAYMENT_MODAL_KEY = "wh-debt-payment"
const PAYMENT_DELETE_KEY = "wh-debt-payment-delete"

const invalidateWarehouse = (
    queryClient: ReturnType<typeof useQueryClient>,
) =>
    queryClient.invalidateQueries({
        predicate: (query) =>
            String(query.queryKey[0]).startsWith("warehouse/"),
    })

type PaymentValues = {
    amount: string
    date: string
    comment: string
}

const PaymentForm = ({ debtor }: { debtor: WhDebtor }) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal(PAYMENT_MODAL_KEY)
    const [serverError, setServerError] = useState("")
    const balance = toNumber(debtor.balance)

    const form = useForm<PaymentValues>({
        defaultValues: {
            amount: balance > 0 ? String(balance) : "",
            date: todayISO(),
            comment: "",
        },
    })
    const { control, handleSubmit, watch } = form
    const amount = toNumber(watch("amount"))

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("wh.debt.payment_saved"))
            closeModal()
            invalidateWarehouse(queryClient)
        },
        onError: (error: any) => {
            const messages = collectErrors(error?.response?.data)
            setServerError(messages.join(" · ") || t("messages.error"))
        },
    })

    const validationError =
        !(amount > 0) ? t("wh.debt.err_amount")
        : amount > balance ? t("wh.debt.err_max")
        : ""

    const onSubmit = (values: PaymentValues) => {
        setServerError("")
        mutate(WAREHOUSE_DEBT_PAYMENTS, {
            tenant: debtor.id,
            amount: values.amount,
            date: values.date,
            comment: values.comment.trim() || undefined,
        })
    }

    const error = validationError || serverError

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3 p-0.5"
        >
            <div className="rounded-lg bg-muted/60 p-3 flex items-center justify-between gap-3">
                <div>
                    <div className="text-xs text-muted-foreground">
                        {t("wh.debt.debtor")}
                    </div>
                    <div className="font-medium">{debtor.name}</div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                        {t("wh.debt.balance")}
                    </div>
                    <div className="font-medium tabular-nums">
                        {formatMoney(debtor.balance)} {t("page.som")}
                    </div>
                </div>
            </div>
            <FormNumberInput
                required
                name="amount"
                label={t("form.amount")}
                control={control}
                allowNegative={false}
                decimalScale={2}
                isAllowed={(v) => (v.floatValue ?? 0) <= balance}
            />
            <FormDatePicker
                required
                fullWidth
                name="date"
                label={t("form.date")}
                control={control}
            />
            <FormTextarea
                name="comment"
                label={t("form.comment")}
                methods={form}
            />
            <div className="flex items-center justify-end gap-3 pt-1">
                {error && (
                    <span className="text-xs text-destructive">{error}</span>
                )}
                <Button
                    type="submit"
                    className="min-w-36"
                    disabled={!!validationError}
                    loading={isPending}
                >
                    {t("wh.debt.accept_payment")}
                </Button>
            </div>
        </form>
    )
}

const Summary = ({
    taken,
    paid,
    balance,
}: {
    taken: string
    paid: string
    balance: string
}) => {
    const { t } = useTranslation()
    const items = [
        { label: t("wh.debt.taken"), value: taken },
        { label: t("wh.debt.paid"), value: paid },
        { label: t("wh.debt.balance"), value: balance },
    ]
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {items.map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/60 p-3">
                    <div className="text-xs text-muted-foreground">
                        {item.label}
                    </div>
                    <div className="text-base font-semibold tabular-nums">
                        {formatMoney(item.value)} {t("page.som")}
                    </div>
                </div>
            ))}
        </div>
    )
}

const money = (value: string | null | undefined, som: string) =>
    <span className="whitespace-nowrap">
        {formatMoney(value ?? 0)} {som}
    </span>

const OwedPart = () => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as OmborSearchParams
    const hasControl = useHasAction("warehouse_control")
    const queryClient = useQueryClient()
    const { openModal: openPayment } = useModal(PAYMENT_MODAL_KEY)
    const { openModal: openDelete } = useModal(PAYMENT_DELETE_KEY)
    const [debtor, setDebtor] = useState<WhDebtor | null>(null)
    const [payment, setPayment] = useState<WhDebtPayment | null>(null)

    const { data: debts, isLoading: debtsLoading } = useGet<
        ListResponse<WhDebtor>
    >(WAREHOUSE_DEBTS, {
        params: { page: search.page, page_size: search.page_size },
    })
    const { data: payments, isLoading: paymentsLoading } = useGet<
        ListResponse<WhDebtPayment>
    >(WAREHOUSE_DEBT_PAYMENTS, {
        params: {
            direction: "received",
            page: search.ppage,
            page_size: search.ppage_size,
        },
    })

    const som = t("page.som")

    const debtCols = useMemo<ColumnDef<WhDebtor>[]>(() => {
        const base: ColumnDef<WhDebtor>[] = [
            {
                id: "name",
                header: t("wh.debt.debtor"),
                cell: ({ row }) => (
                    <span className="font-medium whitespace-nowrap">
                        {row.original.name}
                    </span>
                ),
            },
            {
                id: "taken",
                header: t("wh.debt.taken"),
                cell: ({ row }) => money(row.original.taken, som),
            },
            {
                id: "paid",
                header: t("wh.debt.paid"),
                cell: ({ row }) => money(row.original.paid, som),
            },
            {
                id: "balance",
                header: t("wh.debt.balance"),
                cell: ({ row }) => (
                    <span className="font-semibold">
                        {money(row.original.balance, som)}
                    </span>
                ),
            },
            {
                id: "last",
                header: t("wh.debt.last_payment"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {fmtDate(row.original.last_payment_date)}
                    </span>
                ),
            },
        ]
        if (!hasControl) return base
        return [
            ...base,
            {
                id: "accept",
                header: "",
                cell: ({ row }) => (
                    <Button
                        size="sm"
                        variant="outline"
                        icon={<Wallet size={16} />}
                        disabled={!(toNumber(row.original.balance) > 0)}
                        onClick={() => {
                            setDebtor(row.original)
                            openPayment()
                        }}
                    >
                        {t("wh.debt.accept_payment")}
                    </Button>
                ),
            },
        ]
    }, [t, hasControl])

    const paymentCols = useMemo<ColumnDef<WhDebtPayment>[]>(
        () => [
            {
                id: "debtor",
                header: t("wh.debt.debtor"),
                cell: ({ row }) => (
                    <span className="font-medium whitespace-nowrap">
                        {row.original.tenant_name ?? row.original.tenant}
                    </span>
                ),
            },
            {
                id: "date",
                header: t("form.date"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {fmtDate(row.original.date)}
                    </span>
                ),
            },
            {
                id: "amount",
                header: t("form.amount"),
                cell: ({ row }) => money(row.original.amount, som),
            },
            {
                id: "comment",
                header: t("form.comment"),
                cell: ({ row }) => <span>{row.original.comment || "—"}</span>,
            },
        ],
        [t],
    )

    return (
        <div className="flex flex-col gap-6">
            <DataTable
                numeration
                loading={debtsLoading}
                columns={debtCols}
                data={debts?.results}
                height="h-40"
                className="min-w-[760px]"
                paginationProps={{
                    totalPages: debts?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <div className="flex items-center gap-2 mb-3">
                        <h2 className="text-base font-medium">
                            {t("wh.debt.owed_to_me")}
                        </h2>
                        <Badge>{debts?.count ?? 0}</Badge>
                    </div>
                }
            />
            <DataTable
                numeration
                loading={paymentsLoading}
                columns={paymentCols}
                data={payments?.results}
                height="h-40"
                className="min-w-[640px]"
                onDelete={
                    hasControl ?
                        (row) => {
                            setPayment(row.original)
                            openDelete()
                        }
                    :   undefined
                }
                paginationProps={{
                    totalPages: payments?.total_pages,
                    paramName: "ppage",
                    pageSizeParamName: "ppage_size",
                }}
                head={
                    <div className="flex items-center gap-2 mb-3">
                        <h2 className="text-base font-medium">
                            {t("wh.debt.payments_received")}
                        </h2>
                        <Badge>{payments?.count ?? 0}</Badge>
                    </div>
                }
            />
            {hasControl && debtor && (
                <Modal
                    modalKey={PAYMENT_MODAL_KEY}
                    title={t("wh.debt.accept_payment")}
                    size="max-w-md"
                >
                    <PaymentForm key={debtor.id} debtor={debtor} />
                </Modal>
            )}
            {hasControl && (
                <DeleteModal
                    modalKey={PAYMENT_DELETE_KEY}
                    path={WAREHOUSE_DEBT_PAYMENTS}
                    id={payment?.id}
                    name={
                        payment ?
                            t("wh.debt.payment_delete_name", {
                                date: fmtDate(payment.date),
                                amount: formatMoney(payment.amount),
                            })
                        :   ""
                    }
                    disableRefetch
                    onSuccessAction={() => invalidateWarehouse(queryClient)}
                />
            )}
        </div>
    )
}

const MinePart = () => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as OmborSearchParams
    const som = t("page.som")

    const { data, isLoading } = useGet<WhMyDebt>(WAREHOUSE_MY_DEBT, {
        params: {
            creditor: search.creditor,
            page: search.hpage,
            page_size: search.hpage_size,
        },
    })
    const { data: overall } = useGet<WhMyDebt>(WAREHOUSE_MY_DEBT, {
        params: { page_size: 1 },
    })

    const typeLabel = (type: WhDebtHistoryRow["type"]) =>
        t(`wh.debt.type_${type}`)

    const columns = useMemo<ColumnDef<WhDebtHistoryRow>[]>(
        () => [
            {
                id: "type",
                header: t("wh.debt.type"),
                cell: ({ row }) => (
                    <Badge
                        variant={
                            row.original.type === "payment" ?
                                "secondary"
                            : row.original.type === "transfer" ?
                                "orange"
                            :   "default"
                        }
                    >
                        {typeLabel(row.original.type)}
                    </Badge>
                ),
            },
            {
                id: "date",
                header: t("form.date"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {fmtDate(row.original.date)}
                    </span>
                ),
            },
            {
                id: "product",
                header: t("wh.product"),
                cell: ({ row }) => (
                    <div>
                        <div>{row.original.product_name || "—"}</div>
                        {row.original.vehicle_plate && (
                            <div className="text-xs text-muted-foreground">
                                {row.original.vehicle_plate}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                id: "quantity",
                header: t("form.quantity"),
                cell: ({ row }) =>
                    row.original.quantity ?
                        <span className="whitespace-nowrap">
                            {formatNumber(row.original.quantity)}
                        </span>
                    :   <span>—</span>,
            },
            {
                id: "amount",
                header: t("form.amount"),
                cell: ({ row }) => (
                    <span className="font-medium">
                        {money(row.original.amount, som)}
                    </span>
                ),
            },
            {
                id: "comment",
                header: t("form.comment"),
                cell: ({ row }) => <span>{row.original.comment || "—"}</span>,
            },
        ],
        [t],
    )

    const creditors = overall?.creditors ?? data?.creditors ?? []

    return (
        <DataTable
            numeration
            loading={isLoading}
            columns={columns}
            data={data?.history?.results}
            height="h-40"
            className="min-w-[760px]"
            paginationProps={{
                totalPages: data?.history?.total_pages,
                paramName: "hpage",
                pageSizeParamName: "hpage_size",
            }}
            head={
                <div className="flex flex-col">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                        <h2 className="text-base font-medium">
                            {t("wh.debt.my_debt")}
                        </h2>
                        <ParamCombobox
                            paramName="creditor"
                            options={creditors}
                            valueKey="id"
                            labelKey="name"
                            label={t("wh.debt.creditor")}
                            asloClear={["hpage"]}
                            addButtonProps={{
                                className: "!bg-background dark:!bg-secondary",
                            }}
                        />
                    </div>
                    {data && (
                        <Summary
                            taken={data.taken}
                            paid={data.paid}
                            balance={data.balance}
                        />
                    )}
                    {!search.creditor && creditors.length > 0 && (
                        <div className="rounded-lg border divide-y mb-3">
                            {creditors.map((c) => (
                                <div
                                    key={c.id}
                                    className="p-3 flex items-center justify-between gap-3 flex-wrap text-sm"
                                >
                                    <span className="font-medium">{c.name}</span>
                                    <span className="tabular-nums text-muted-foreground">
                                        {t("wh.debt.taken")}:{" "}
                                        {formatMoney(c.taken)} ·{" "}
                                        {t("wh.debt.paid")}: {formatMoney(c.paid)}{" "}
                                        ·{" "}
                                        <span className="font-semibold text-foreground">
                                            {t("wh.debt.balance")}:{" "}
                                            {formatMoney(c.balance)} {som}
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            }
        />
    )
}

const DebtsSection = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { dtab } = useSearch({ strict: false }) as OmborSearchParams
    const active = dtab === "mine" ? "mine" : "owed"

    return (
        <div className="flex flex-col w-full gap-3">
            <Tabs
                value={active}
                onValueChange={(value) =>
                    navigate({
                        search: (prev: Record<string, unknown>) => ({
                            ...prev,
                            dtab: value === "owed" ? undefined : value,
                            creditor: undefined,
                            page: undefined,
                            ppage: undefined,
                            hpage: undefined,
                        }),
                    } as never)
                }
            >
                <TabsList>
                    <TabsTrigger value="owed">{t("wh.debt.owed_to_me")}</TabsTrigger>
                    <TabsTrigger value="mine">{t("wh.debt.my_debt")}</TabsTrigger>
                </TabsList>
            </Tabs>
            {active === "owed" ? <OwedPart /> : <MinePart />}
        </div>
    )
}

export default DebtsSection
