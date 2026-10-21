import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MANAGERS_CASHFLOW, MANAGERS_EXPENSES, MANAGERS_ORDERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { formatDateTime } from "@/lib/format-date"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { ReactNode, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import i18n from "@/i18n/i18n"
import PendingAdvances from "./pending-advances"
import CloseDateField from "./close-date-field"
import SplitPreview from "./split-preview"

type Expense = { id: number; amount: number; category: number | null; category_name: string | null; comment: string | null; date: string }

type SalaryOrder = { order: number; route: string; date: string | null; status_label: string | null; tariff: number | null; amount: number | null }

type EmptyLegSalary = {
    label: string
    count: number
    amount: number
    legs: { id: number; route: string; start: string | null; end: string | null; km: number | null; amount: number }[]
}

type ExtraPaySalary = {
    label: string
    count: number
    amount: number
    orders: { order: number; route: string; date: string | null; comment: string | null; amount: number }[]
}

type Preview = {
    given: number
    earned: number
    spent: number
    due: number
    carry_in?: number
    salary_default: number
    expenses: Expense[]
    salary_orders?: SalaryOrder[]
    empty_leg_salary?: EmptyLegSalary | null
    extra_pay_salary?: ExtraPaySalary | null
}

type FlowRow = { id: number; action: number; amount: number; comment: string | null; created: string; loading_name: string | null; unloading_name: string | null; payment_type_name: string | null; category_code?: string | null }

type OrderRow = { id: number; loading_name: string; unloading_name: string; date?: string | null; status?: number }

export type KassaCloseState = {
    ready: boolean
    amount: number
    settle: number
    salary: number
    salaries: { order: number; amount: number }[]
    expenses: { id: number; amount: number; category: number | null; comment: string | null }[]
}


const EDIT_MODAL = "kassa-close-expense-edit"
const DELETE_MODAL = "kassa-close-expense-delete"
const SALARY_MODAL = "kassa-close-salary-edit"
const ORDER_STATUS: Record<number, string> = { [-1]: "status.draft", 0: "trips.status.pending", 1: "trips.status.started", 5: "trips.status.loading", 6: "trips.status.on_road", 7: "trips.status.unloading", 2: "trips.status.finished", 3: "trips.status.cancelled", 4: "trips.status.archived" }

const COMPACT = "min-w-0"
const money = (v: number) => (v < 0 ? "−" : "") + Math.abs(Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")

const errorText = (e: any) => {
    const d = e?.response?.data
    if (!d) return i18n.t("trips.row.error")
    if (d.detail) return String(d.detail)
    const first = Object.values(d)[0]
    return Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : i18n.t("trips.row.error")
}

const Row = ({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) => (
    <div className={cn("flex items-center justify-between gap-3 py-1.5 text-sm", className)}>
        <span>{label}</span>
        <span className="tabular-nums whitespace-nowrap">{value}</span>
    </div>
)

const route = (a?: string | null, b?: string | null) => [a, b].filter(Boolean).join(" → ") || "—"

export default function KassaCloseSection({ tripId, onChange, tech, closeDate, onCloseDateChange }: {
    tripId?: number
    onChange: (s: KassaCloseState) => void
    tech?: ReactNode
    closeDate?: string
    onCloseDateChange?: (d: string) => void
}) {
    const { t } = useTranslation()
    const previewUrl = `checkout/kassa-v2/trips/${tripId}/close-preview`
    const qc = useQueryClient()
    const { data: preview, isLoading } = useGet<Preview>(previewUrl, { params: { date: closeDate }, enabled: !!tripId, options: { staleTime: 0, gcTime: 0, retry: closeDate ? false : 3 } })
    const { data: categories } = useGet<{ id: number; name: string }[]>("checkout/kassa-v2/expense-categories")
    const { data: flows } = useGet<{ results: FlowRow[] }>(MANAGERS_CASHFLOW, {
        params: { trip: tripId, action: "1,2", driver: true, page_size: 100000 },
        enabled: !!tripId,
        options: { queryKey: [MANAGERS_CASHFLOW, "kassa-close", tripId] },
    })
    const { data: orders } = useGet<{ results: OrderRow[] }>(MANAGERS_ORDERS, { params: { trip: tripId, page_size: 200 }, enabled: !!tripId })
    const { data: pendingReqs } = useGet<{ results: { amount: string }[] }>("checkout/kassa-v2/requests", {
        params: { trip: tripId, kind: "avans,qoshimcha", status: "10" },
        enabled: !!tripId,
    })

    const [salaries, setSalaries] = useState<Record<number, number>>({})
    const [selected, setSelected] = useState<Expense | null>(null)
    const [salaryRow, setSalaryRow] = useState<SalaryOrder | null>(null)
    const edit = useModal(EDIT_MODAL)
    const del = useModal(DELETE_MODAL)
    const salaryModal = useModal(SALARY_MODAL)

    const refresh = () =>
        qc.invalidateQueries({
            predicate: (q) => {
                const k = String(q.queryKey[0])
                return k === previewUrl || k.includes("cashflow") || k.startsWith("checkout/kassa-v2")
            },
        })

    const keptFlows = useMemo(() => {
        const all = flows?.results ?? []
        if (!closeDate) return all
        const limit = new Date(`${closeDate}T23:59:59+05:00`).getTime()
        return all.filter((f) => new Date(f.created).getTime() <= limit)
    }, [flows, closeDate])
    const advances = useMemo(() => keptFlows.filter((f) => f.action === 2), [keptFlows])
    const incomes = useMemo(() => keptFlows.filter((f) => f.action === 1), [keptFlows])
    const pendingCount = pendingReqs?.results?.length ?? 0
    const pendingSum = (pendingReqs?.results ?? []).reduce((a, r) => a + Number(r.amount), 0)

    const salaryRows = useMemo<SalaryOrder[]>(() => {
        if (preview?.salary_orders) return preview.salary_orders
        return (orders?.results ?? []).map((o) => ({
            order: o.id,
            route: route(o.loading_name, o.unloading_name),
            date: o.date ?? null,
            status_label: o.status != null && ORDER_STATUS[o.status] ? t(ORDER_STATUS[o.status]) : null,
            tariff: null,
            amount: null,
        }))
    }, [preview, orders, t])

    useEffect(() => {
        const init: Record<number, number> = {}
        salaryRows.forEach((r) => { init[r.order] = Number(r.amount ?? r.tariff ?? 0) })
        setSalaries(init)
    }, [salaryRows])

    const emptyLegs = preview?.empty_leg_salary
    const emptyLegAmount = Number(emptyLegs?.amount ?? 0)
    const extraPay = preview?.extra_pay_salary
    const extraPayAmount = Number(extraPay?.amount ?? 0)
    const salaryTotal = Object.values(salaries).reduce((a, v) => a + (Number(v) || 0), 0)
    const due = preview ? Number(preview.due) : 0
    const net = due - salaryTotal - emptyLegAmount - extraPayAmount
    const [settle, setSettle] = useState<number | "">("")
    useEffect(() => { setSettle(Math.abs(Math.round(net))) }, [net])
    const settleNow = net > 0 ? Math.min(Number(settle) || 0, Math.round(net)) : Math.abs(Math.round(net))
    const carryOut = Math.abs(Math.round(net)) - settleNow
    const carryIn = Number(preview?.carry_in ?? 0)

    useEffect(() => {
        onChange({
            ready: !!preview,
            amount: net,
            settle: settleNow,
            salary: salaryTotal + emptyLegAmount + extraPayAmount,
            salaries: Object.entries(salaries).map(([order, value]) => ({ order: Number(order), amount: Number(value) || 0 })),
            expenses: [],
        })
    }, [preview, net, settleNow, salaryTotal, emptyLegAmount, extraPayAmount, salaries])

    const { mutate: patch, isPending: saving } = usePatch({ meta: { skipGlobalError: true } })
    const form = useForm<{ amount: number | ""; category: string; comment: string }>({ defaultValues: { amount: "", category: "", comment: "" } })
    useEffect(() => {
        if (edit.isOpen && selected)
            form.reset({ amount: Number(selected.amount), category: selected.category ? String(selected.category) : "", comment: selected.comment ?? "" })
    }, [edit.isOpen, selected])
    const salaryForm = useForm<{ amount: number | "" }>({ defaultValues: { amount: "" } })
    useEffect(() => {
        if (salaryModal.isOpen && salaryRow) salaryForm.reset({ amount: salaries[salaryRow.order] ?? 0 })
    }, [salaryModal.isOpen, salaryRow])

    const expenseCols = useMemo<ColumnDef<Expense>[]>(() => [
        { header: t("form.amount_total"), accessorKey: "amount", cell: ({ row }) => <span className="text-red-500 font-medium whitespace-nowrap">−{formatMoney(Number(row.original.amount))}</span> },
        { header: t("form.applies_to"), accessorKey: "category_name", cell: ({ row }) => row.original.category_name || "—" },
        { header: t("form.date"), accessorKey: "date", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.date)}</span> },
    ], [t])
    const advanceCols = useMemo<ColumnDef<FlowRow>[]>(() => [
        { header: t("form.amount_total"), accessorKey: "amount", meta: { className: "w-px whitespace-nowrap" }, cell: ({ row }) => <span className="text-green-600 font-medium whitespace-nowrap">+{formatMoney(Number(row.original.amount))}</span> },
        { header: t("trips.kclose.what_for"), id: "kind", meta: { className: "w-full" }, cell: ({ row }) => row.original.comment || t("trips.kclose.advance") },
        { header: t("form.date"), accessorKey: "created", meta: { className: "w-px whitespace-nowrap" }, cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.created)}</span> },
    ], [t])
    const incomeCols = useMemo<ColumnDef<FlowRow>[]>(() => [
        { header: t("form.amount_total"), accessorKey: "amount", cell: ({ row }) => <span className="text-green-600 font-medium whitespace-nowrap">+{formatMoney(Number(row.original.amount))}</span> },
        { header: t("trips.kclose.trip"), id: "route", cell: ({ row }) => route(row.original.loading_name, row.original.unloading_name) },
        { header: t("form.date"), accessorKey: "created", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.created)}</span> },
    ], [t])
    const salaryCols = useMemo<ColumnDef<SalaryOrder>[]>(() => [
        { header: t("trips.kclose.salary"), id: "amount", cell: ({ row }) => <span className="font-medium whitespace-nowrap">{formatMoney(salaries[row.original.order] ?? 0)}</span> },
        { header: t("trips.kclose.trip"), accessorKey: "route" },
        { header: t("trips.kclose.state"), accessorKey: "status_label", cell: ({ row }) => row.original.status_label || "—" },
        { header: t("trips.kclose.by_tariff"), accessorKey: "tariff", cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{row.original.tariff != null ? formatMoney(Number(row.original.tariff)) : "—"}</span> },
        { header: t("form.date"), accessorKey: "date", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{row.original.date || "—"}</span> },
    ], [salaries, t])

    const emptyLegCols = useMemo<ColumnDef<EmptyLegSalary["legs"][number]>[]>(() => [
        { header: t("form.amount_total"), accessorKey: "amount", cell: ({ row }) => <span className="font-medium whitespace-nowrap">{formatMoney(Number(row.original.amount))}</span> },
        { header: t("form.direction"), accessorKey: "route" },
        { header: t("trips.units.km_title"), accessorKey: "km", cell: ({ row }) => <span className="whitespace-nowrap">{row.original.km != null ? `${formatMoney(Number(row.original.km))} ${t("trips.units.km")}` : "—"}</span> },
        { header: t("form.date"), accessorKey: "start", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.start ?? undefined)}</span> },
    ], [t])

    const extraPayCols: ColumnDef<ExtraPaySalary["orders"][number]>[] = [
        { header: t("form.amount_total"), accessorKey: "amount", cell: ({ row }) => <span className="font-medium whitespace-nowrap">{formatMoney(Number(row.original.amount))}</span> },
        { header: t("trips.kclose.trip"), accessorKey: "route" },
        { header: t("form.comment"), accessorKey: "comment", cell: ({ row }) => row.original.comment || "—" },
        { header: t("form.date"), accessorKey: "date", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{row.original.date || "—"}</span> },
    ]

    if (isLoading || !preview) return <p className="text-sm text-muted-foreground">{t("trips.kclose.loading")}</p>

    const returns = net >= 0
    const catList = (() => {
        const list = categories ?? []
        return selected?.category && !list.some((c) => c.id === selected.category)
            ? [...list, { id: selected.category, name: selected.category_name ?? `#${selected.category}` }]
            : list
    })()

    const line = (label: ReactNode, value: string) => (
        <span className="flex flex-1 items-center justify-between gap-3 text-left">
            <span className="flex items-center gap-1.5">{label}</span>
            <span className={cn("tabular-nums whitespace-nowrap", value.startsWith("+") && "text-green-600", value.startsWith("−") && "text-destructive")}>{value}</span>
        </span>
    )
    const trigger = "-mx-3 px-3 gap-2 rounded-md py-2.5 text-sm font-normal hover:no-underline"

    return (
        <div className="flex flex-col gap-3">
            {onCloseDateChange && tripId && <CloseDateField value={closeDate} onChange={onCloseDateChange} />}
            {closeDate && <SplitPreview tripId={tripId} date={closeDate} />}
            {tech && <section className="rounded-lg border bg-muted/20 p-4 space-y-3">{tech}</section>}

            <Accordion type="single" collapsible className="rounded-lg border bg-muted/20 px-4 py-1 divide-y">
                <AccordionItem value="given" className="border-0">
                    <AccordionTrigger className={trigger}>
                        {line(
                            <>{t("trips.kclose.advance")}{pendingCount ? <Badge variant="orange" className="h-5 px-1.5">{pendingCount}</Badge> : null}</>,
                            `+${money(Number(preview.given))}`,
                        )}
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 space-y-2">
                        {pendingCount > 0 && (
                            <div className="rounded-md border border-orange-500/30 bg-orange-500/5 px-3 py-2 text-sm text-orange-600">
                                {t("trips.kclose.pending_text", { count: pendingCount, sum: money(pendingSum) })}
                            </div>
                        )}
                        <div className="max-h-[38vh] overflow-y-auto">
                            <PendingAdvances tripId={tripId} />
                            <DataTable columns={advanceCols} data={advances} numeration viewAll className={COMPACT} />
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="incomes" className="border-0">
                    <AccordionTrigger className={trigger}>{line(t("trips.kclose.cash_trip_money"), `+${money(Number(preview.earned))}`)}</AccordionTrigger>
                    <AccordionContent className="pb-3">
                        <div className="max-h-[38vh] overflow-y-auto">
                            <DataTable columns={incomeCols} data={incomes} numeration viewAll className={COMPACT} />
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="expenses" className="border-0">
                    <AccordionTrigger className={trigger}>{line(t("trips.kclose.cash_expenses"), `−${money(Number(preview.spent))}`)}</AccordionTrigger>
                    <AccordionContent className="pb-3">
                        <div className="max-h-[38vh] overflow-y-auto">
                            <DataTable
                                className={COMPACT}
                                columns={expenseCols}
                                data={preview.expenses}
                                numeration
                                viewAll
                                onEdit={({ original }) => { setSelected(original); edit.openModal() }}
                                onDelete={({ original }) => { setSelected(original); del.openModal() }}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
                {carryIn !== 0 && (
                    <Row
                        className="py-2.5 pr-6"
                        label={carryIn > 0 ? t("trips.kclose.carry_in_avans") : t("trips.kclose.carry_in_owed")}
                        value={<span className={carryIn > 0 ? "text-green-600" : "text-destructive"}>{carryIn > 0 ? "+" : "−"}{money(Math.abs(carryIn))}</span>}
                    />
                )}
                <Row className="py-2.5 pr-6" label={t("trips.kclose.driver_holds")} value={<span className="text-blue-600 dark:text-blue-400">{money(due)}</span>} />
                <AccordionItem value="salaries" className="border-0">
                    <AccordionTrigger className={trigger}>{line(t("trips.kclose.salary"), `−${money(salaryTotal)}`)}</AccordionTrigger>
                    <AccordionContent className="pb-3">
                        <div className="max-h-[38vh] overflow-y-auto">
                            <DataTable
                                className={COMPACT}
                                columns={salaryCols}
                                data={salaryRows}
                                numeration
                                viewAll
                                onEdit={({ original }) => { setSalaryRow(original); salaryModal.openModal() }}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
                {emptyLegs && emptyLegAmount > 0 && (
                    <AccordionItem value="empty-legs" className="border-0">
                        <AccordionTrigger className={trigger}>
                            {line(
                                <>{emptyLegs.label || t("trips.managers.empty_run")}<Badge variant="outline" className="h-5 px-1.5">{emptyLegs.count}</Badge></>,
                                `−${money(emptyLegAmount)}`,
                            )}
                        </AccordionTrigger>
                        <AccordionContent className="pb-3">
                            <div className="max-h-[38vh] overflow-y-auto">
                                <DataTable className={COMPACT} columns={emptyLegCols} data={emptyLegs.legs} numeration viewAll />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}
                {extraPay && extraPayAmount > 0 && (
                    <AccordionItem value="extra-pay" className="border-0">
                        <AccordionTrigger className={trigger}>
                            {line(
                                <>{t("trips.reys_cols.extra_pay_list")}<Badge variant="outline" className="h-5 px-1.5">{extraPay.count}</Badge></>,
                                `−${money(extraPayAmount)}`,
                            )}
                        </AccordionTrigger>
                        <AccordionContent className="pb-3">
                            <div className="max-h-[38vh] overflow-y-auto">
                                <DataTable className={COMPACT} columns={extraPayCols} data={extraPay.orders} numeration viewAll />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}
                <Row
                    className={cn("font-semibold py-2.5 pr-6", returns ? "text-green-600" : "text-destructive")}
                    label={returns ? t("trips.kclose.cashier_takes") : t("trips.kclose.cashier_gives")}
                    value={money(Math.abs(net))}
                />
            </Accordion>

            {Math.round(net) > 0 && (
                <section className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-2">
                    <label className="flex flex-col gap-1.5 text-sm font-medium">
                        {t("trips.kclose.settle_take")}
                        <input
                            type="text"
                            inputMode="numeric"
                            className="h-10 rounded-md border bg-background px-3 text-sm font-normal tabular-nums"
                            value={settle === "" ? "" : money(Number(settle))}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, "")
                                setSettle(raw === "" ? "" : Math.min(Number(raw), Math.abs(Math.round(net))))
                            }}
                        />
                    </label>
                    <p className="text-xs text-muted-foreground">{t("trips.kclose.settle_hint", { max: money(Math.abs(net)) })}</p>
                    {carryOut > 0 && (
                        <Row
                            className="font-medium"
                            label={t("trips.kclose.carry_out_debt")}
                            value={<span className="text-orange-600">{money(carryOut)}</span>}
                        />
                    )}
                </section>
            )}

            <Modal modalKey={EDIT_MODAL} title={t("trips.kclose.edit_expense")} size="max-w-md">
                <form
                    className="flex flex-col gap-3"
                    onSubmit={form.handleSubmit((v) => {
                        if (!selected) return
                        patch(`${MANAGERS_EXPENSES}/${selected.id}`, { amount: Number(v.amount), category: v.category ? Number(v.category) : null, comment: v.comment || null }, {
                            onSuccess: () => { toast.success(t("trips.kclose.expense_changed")); refresh(); edit.closeModal() },
                            onError: (e: unknown) => toast.error(errorText(e)),
                        })
                    })}
                >
                    <FormNumberInput required control={form.control} name="amount" label={t("form.amount_total")} thousandSeparator=" " allowNegative={false} registerOptions={{ validate: (v: unknown) => Number(v) > 0 || t("kassa.amount_gt_zero") }} />
                    <label className="flex flex-col gap-1.5 text-sm font-medium">
                        {t("form.applies_to")}
                        <select {...form.register("category")} className="h-10 rounded-md border bg-background px-3 text-sm font-normal">
                            {catList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </label>
                    <FormTextarea label={t("form.comment")} name="comment" methods={form} />
                    <div className="flex justify-end">
                        <Button type="submit" className="min-w-32" loading={saving}>{t("actions.save")}</Button>
                    </div>
                </form>
            </Modal>

            <Modal modalKey={SALARY_MODAL} title={t("trips.kclose.edit_salary")} size="max-w-md">
                <form
                    className="flex flex-col gap-3"
                    onSubmit={salaryForm.handleSubmit((v) => {
                        if (!salaryRow) return
                        setSalaries((s) => ({ ...s, [salaryRow.order]: Number(v.amount) || 0 }))
                        salaryModal.closeModal()
                    })}
                >
                    <p className="text-sm text-muted-foreground">
                        {t("trips.kclose.salary_hint", {
                            route: salaryRow?.route,
                            tariff: salaryRow?.tariff != null ? `${money(Number(salaryRow.tariff))} ${t("trips.units.som")}` : t("trips.kclose.not_set"),
                        })}
                    </p>
                    <FormNumberInput control={salaryForm.control} name="amount" label={t("trips.kclose.salary")} thousandSeparator=" " allowNegative={false} />
                    <div className="flex justify-end">
                        <Button type="submit" className="min-w-32">{t("actions.save")}</Button>
                    </div>
                </form>
            </Modal>

            <DeleteModal path={MANAGERS_EXPENSES} id={selected?.id} modalKey={DELETE_MODAL} onSuccessAction={refresh} />
        </div>
    )
}
