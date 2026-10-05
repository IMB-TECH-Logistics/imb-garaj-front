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
import PendingAdvances from "./pending-advances"

type Expense = { id: number; amount: number; category: number | null; category_name: string | null; comment: string | null; date: string }

type SalaryOrder = { order: number; route: string; date: string | null; status_label: string | null; tariff: number | null; amount: number | null }

type EmptyLegSalary = {
    label: string
    count: number
    amount: number
    legs: { id: number; route: string; start: string | null; end: string | null; km: number | null; amount: number }[]
}

type Preview = {
    given: number
    earned: number
    spent: number
    due: number
    salary_default: number
    expenses: Expense[]
    salary_orders?: SalaryOrder[]
    empty_leg_salary?: EmptyLegSalary | null
}

type FlowRow = { id: number; action: number; amount: number; comment: string | null; created: string; loading_name: string | null; unloading_name: string | null; payment_type_name: string | null; category_code?: string | null }

type OrderRow = { id: number; loading_name: string; unloading_name: string; date?: string | null; status?: number }

export type KassaCloseState = {
    ready: boolean
    amount: number
    salary: number
    salaries: { order: number; amount: number }[]
    expenses: { id: number; amount: number; category: number | null; comment: string | null }[]
}


const EDIT_MODAL = "kassa-close-expense-edit"
const DELETE_MODAL = "kassa-close-expense-delete"
const SALARY_MODAL = "kassa-close-salary-edit"
const ORDER_STATUS: Record<number, string> = { [-1]: "Qoralama", 0: "Kutilmoqda", 1: "Boshlandi", 5: "Yuklanmoqda", 6: "Yo'lda", 7: "Tushirilmoqda", 2: "Tugallandi", 3: "Bekor qilindi", 4: "Arxivlangan" }

const COMPACT = "min-w-0"
const money = (v: number) => (v < 0 ? "−" : "") + Math.abs(Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")

const errorText = (e: any) => {
    const d = e?.response?.data
    if (!d) return "Xatolik yuz berdi"
    if (d.detail) return String(d.detail)
    const first = Object.values(d)[0]
    return Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : "Xatolik yuz berdi"
}

const Row = ({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) => (
    <div className={cn("flex items-center justify-between gap-3 py-1.5 text-sm", className)}>
        <span>{label}</span>
        <span className="tabular-nums whitespace-nowrap">{value}</span>
    </div>
)

const route = (a?: string | null, b?: string | null) => [a, b].filter(Boolean).join(" → ") || "—"

export default function KassaCloseSection({ tripId, onChange, tech }: {
    tripId?: number
    onChange: (s: KassaCloseState) => void
    tech?: ReactNode
}) {
    const previewUrl = `checkout/kassa-v2/trips/${tripId}/close-preview`
    const qc = useQueryClient()
    const { data: preview, isLoading } = useGet<Preview>(previewUrl, { enabled: !!tripId, options: { staleTime: 0, gcTime: 0 } })
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

    const advances = useMemo(() => (flows?.results ?? []).filter((f) => f.action === 2), [flows])
    const incomes = useMemo(() => (flows?.results ?? []).filter((f) => f.action === 1), [flows])
    const pendingCount = pendingReqs?.results?.length ?? 0
    const pendingSum = (pendingReqs?.results ?? []).reduce((a, r) => a + Number(r.amount), 0)

    const salaryRows = useMemo<SalaryOrder[]>(() => {
        if (preview?.salary_orders) return preview.salary_orders
        return (orders?.results ?? []).map((o) => ({
            order: o.id,
            route: route(o.loading_name, o.unloading_name),
            date: o.date ?? null,
            status_label: o.status != null ? ORDER_STATUS[o.status] ?? null : null,
            tariff: null,
            amount: null,
        }))
    }, [preview, orders])

    useEffect(() => {
        const init: Record<number, number> = {}
        salaryRows.forEach((r) => { init[r.order] = Number(r.amount ?? r.tariff ?? 0) })
        setSalaries(init)
    }, [salaryRows])

    const emptyLegs = preview?.empty_leg_salary
    const emptyLegAmount = Number(emptyLegs?.amount ?? 0)
    const salaryTotal = Object.values(salaries).reduce((a, v) => a + (Number(v) || 0), 0)
    const due = preview ? Number(preview.due) : 0
    const net = due - salaryTotal - emptyLegAmount

    useEffect(() => {
        onChange({
            ready: !!preview,
            amount: net,
            salary: salaryTotal + emptyLegAmount,
            salaries: Object.entries(salaries).map(([order, value]) => ({ order: Number(order), amount: Number(value) || 0 })),
            expenses: [],
        })
    }, [preview, net, salaryTotal, emptyLegAmount, salaries])

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
        { header: "Summa", accessorKey: "amount", cell: ({ row }) => <span className="text-red-500 font-medium whitespace-nowrap">−{formatMoney(Number(row.original.amount))}</span> },
        { header: "Turi", accessorKey: "category_name", cell: ({ row }) => row.original.category_name || "—" },
        { header: "Sana", accessorKey: "date", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.date)}</span> },
    ], [])
    const advanceCols = useMemo<ColumnDef<FlowRow>[]>(() => [
        { header: "Summa", accessorKey: "amount", meta: { className: "w-px whitespace-nowrap" }, cell: ({ row }) => <span className="text-green-600 font-medium whitespace-nowrap">+{formatMoney(Number(row.original.amount))}</span> },
        { header: "Nima uchun", id: "kind", meta: { className: "w-full" }, cell: ({ row }) => row.original.comment || "Avans" },
        { header: "Sana", accessorKey: "created", meta: { className: "w-px whitespace-nowrap" }, cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.created)}</span> },
    ], [])
    const incomeCols = useMemo<ColumnDef<FlowRow>[]>(() => [
        { header: "Summa", accessorKey: "amount", cell: ({ row }) => <span className="text-green-600 font-medium whitespace-nowrap">+{formatMoney(Number(row.original.amount))}</span> },
        { header: "Reys", id: "route", cell: ({ row }) => route(row.original.loading_name, row.original.unloading_name) },
        { header: "Sana", accessorKey: "created", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.created)}</span> },
    ], [])
    const salaryCols = useMemo<ColumnDef<SalaryOrder>[]>(() => [
        { header: "Oylik", id: "amount", cell: ({ row }) => <span className="font-medium whitespace-nowrap">{formatMoney(salaries[row.original.order] ?? 0)}</span> },
        { header: "Reys", accessorKey: "route" },
        { header: "Holat", accessorKey: "status_label", cell: ({ row }) => row.original.status_label || "—" },
        { header: "Tarif bo'yicha", accessorKey: "tariff", cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{row.original.tariff != null ? formatMoney(Number(row.original.tariff)) : "—"}</span> },
        { header: "Sana", accessorKey: "date", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{row.original.date || "—"}</span> },
    ], [salaries])

    const emptyLegCols = useMemo<ColumnDef<EmptyLegSalary["legs"][number]>[]>(() => [
        { header: "Summa", accessorKey: "amount", cell: ({ row }) => <span className="font-medium whitespace-nowrap">{formatMoney(Number(row.original.amount))}</span> },
        { header: "Yo'nalish", accessorKey: "route" },
        { header: "Km", accessorKey: "km", cell: ({ row }) => <span className="whitespace-nowrap">{row.original.km != null ? `${formatMoney(Number(row.original.km))} km` : "—"}</span> },
        { header: "Sana", accessorKey: "start", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.start ?? undefined)}</span> },
    ], [])

    if (isLoading || !preview) return <p className="text-sm text-muted-foreground">Kassa hisobi yuklanmoqda…</p>

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
            {tech && <section className="rounded-lg border bg-muted/20 p-4 space-y-3">{tech}</section>}

            <Accordion type="single" collapsible className="rounded-lg border bg-muted/20 px-4 py-1 divide-y">
                <AccordionItem value="given" className="border-0">
                    <AccordionTrigger className={trigger}>
                        {line(
                            <>Avans{pendingCount ? <Badge variant="orange" className="h-5 px-1.5">{pendingCount}</Badge> : null}</>,
                            `+${money(Number(preview.given))}`,
                        )}
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 space-y-2">
                        {pendingCount > 0 && (
                            <div className="rounded-md border border-orange-500/30 bg-orange-500/5 px-3 py-2 text-sm text-orange-600">
                                {pendingCount} ta so'rov kassirda kutilmoqda: {money(pendingSum)} so'm. U hisobga kirmagan — haydovchiga hali berilmagan.
                            </div>
                        )}
                        <div className="max-h-[38vh] overflow-y-auto">
                            <PendingAdvances tripId={tripId} />
                            <DataTable columns={advanceCols} data={advances} numeration viewAll className={COMPACT} />
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="incomes" className="border-0">
                    <AccordionTrigger className={trigger}>{line("Naqd reys puli", `+${money(Number(preview.earned))}`)}</AccordionTrigger>
                    <AccordionContent className="pb-3">
                        <div className="max-h-[38vh] overflow-y-auto">
                            <DataTable columns={incomeCols} data={incomes} numeration viewAll className={COMPACT} />
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="expenses" className="border-0">
                    <AccordionTrigger className={trigger}>{line("Naqd xarajatlar", `−${money(Number(preview.spent))}`)}</AccordionTrigger>
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
                <Row className="py-2.5 pr-6" label="Haydovchi qo'lida qolgan" value={<span className="text-blue-600 dark:text-blue-400">{money(due)}</span>} />
                <AccordionItem value="salaries" className="border-0">
                    <AccordionTrigger className={trigger}>{line("Oylik", `−${money(salaryTotal)}`)}</AccordionTrigger>
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
                                <>{emptyLegs.label || "Bo'sh yurish"}<Badge variant="outline" className="h-5 px-1.5">{emptyLegs.count}</Badge></>,
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
                <Row
                    className={cn("font-semibold py-2.5 pr-6", returns ? "text-green-600" : "text-destructive")}
                    label={returns ? "Kassa haydovchidan oladi" : "Kassa haydovchiga beradi"}
                    value={money(Math.abs(net))}
                />
            </Accordion>

            <Modal modalKey={EDIT_MODAL} title="Xarajatni tahrirlash" size="max-w-md">
                <form
                    className="flex flex-col gap-3"
                    onSubmit={form.handleSubmit((v) => {
                        if (!selected) return
                        patch(`${MANAGERS_EXPENSES}/${selected.id}`, { amount: Number(v.amount), category: v.category ? Number(v.category) : null, comment: v.comment || null }, {
                            onSuccess: () => { toast.success("Xarajat o'zgartirildi"); refresh(); edit.closeModal() },
                            onError: (e: unknown) => toast.error(errorText(e)),
                        })
                    })}
                >
                    <FormNumberInput required control={form.control} name="amount" label="Summa" thousandSeparator=" " allowNegative={false} registerOptions={{ validate: (v: unknown) => Number(v) > 0 || "Summa 0 dan katta bo'lsin" }} />
                    <label className="flex flex-col gap-1.5 text-sm font-medium">
                        Turi
                        <select {...form.register("category")} className="h-10 rounded-md border bg-background px-3 text-sm font-normal">
                            {catList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </label>
                    <FormTextarea label="Izoh" name="comment" methods={form} />
                    <div className="flex justify-end">
                        <Button type="submit" className="min-w-32" loading={saving}>Saqlash</Button>
                    </div>
                </form>
            </Modal>

            <Modal modalKey={SALARY_MODAL} title="Reys oyligini o'zgartirish" size="max-w-md">
                <form
                    className="flex flex-col gap-3"
                    onSubmit={salaryForm.handleSubmit((v) => {
                        if (!salaryRow) return
                        setSalaries((s) => ({ ...s, [salaryRow.order]: Number(v.amount) || 0 }))
                        salaryModal.closeModal()
                    })}
                >
                    <p className="text-sm text-muted-foreground">
                        {salaryRow?.route} · tarif bo'yicha: {salaryRow?.tariff != null ? `${money(Number(salaryRow.tariff))} so'm` : "belgilanmagan"}. Bonus yoki jarima bo'lsa summani o'zgartiring.
                    </p>
                    <FormNumberInput control={salaryForm.control} name="amount" label="Oylik" thousandSeparator=" " allowNegative={false} />
                    <div className="flex justify-end">
                        <Button type="submit" className="min-w-32">Saqlash</Button>
                    </div>
                </form>
            </Modal>

            <DeleteModal path={MANAGERS_EXPENSES} id={selected?.id} modalKey={DELETE_MODAL} onSuccessAction={refresh} />
        </div>
    )
}
