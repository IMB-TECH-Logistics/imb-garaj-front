import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

type Preview = {
    prior: number
    given: number
    earned: number
    spent: number
    due: number
    salary_default: number
    expenses: Expense[]
    salary_orders?: SalaryOrder[]
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

type InnerTab = "given" | "incomes" | "expenses" | "salaries"

const EDIT_MODAL = "kassa-close-expense-edit"
const DELETE_MODAL = "kassa-close-expense-delete"
const SALARY_MODAL = "kassa-close-salary-edit"
const ORDER_STATUS: Record<number, string> = { [-1]: "Qoralama", 0: "Kutilmoqda", 1: "Boshlandi", 5: "Yuklanmoqda", 6: "Yo'lda", 7: "Tushirilmoqda", 2: "Tugallandi", 3: "Bekor qilindi", 4: "Arxivlangan" }

const money = (v: number) => (v < 0 ? "−" : "") + Math.abs(Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
const digits = (v: string) => Number(v.replace(/\D/g, ""))

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

export default function KassaCloseSection({ tripId, onChange }: { tripId?: number; onChange: (s: KassaCloseState) => void }) {
    const previewUrl = `checkout/kassa-v2/trips/${tripId}/close-preview`
    const qc = useQueryClient()
    const [inner, setInner] = useState<InnerTab>("given")
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

    const [paid, setPaid] = useState<number | "">("")
    const [salaryOn, setSalaryOn] = useState(true)
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

    const salaryTotal = Object.values(salaries).reduce((a, v) => a + (Number(v) || 0), 0)
    const due = preview ? Number(preview.due) : 0
    useEffect(() => { if (preview) setPaid(Math.abs(Number(preview.due))) }, [preview?.due])

    const amount = Number(paid || 0)
    useEffect(() => {
        onChange({
            ready: !!preview,
            amount,
            salary: salaryOn ? salaryTotal : 0,
            salaries: salaryOn ? Object.entries(salaries).map(([order, value]) => ({ order: Number(order), amount: Number(value) || 0 })) : [],
            expenses: [],
        })
    }, [preview, amount, salaryOn, salaryTotal, salaries])

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
        { header: "Izoh", accessorKey: "comment", cell: ({ row }) => <span className="text-muted-foreground">{row.original.comment || "—"}</span> },
        { header: "Sana", accessorKey: "date", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.date)}</span> },
    ], [])
    const advanceCols = useMemo<ColumnDef<FlowRow>[]>(() => [
        { header: "Summa", accessorKey: "amount", cell: ({ row }) => <span className="text-green-600 font-medium whitespace-nowrap">+{formatMoney(Number(row.original.amount))}</span> },
        { header: "Nima uchun", id: "kind", cell: ({ row }) => row.original.comment || "Avans" },
        { header: "Sana", accessorKey: "created", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.created)}</span> },
    ], [])
    const incomeCols = useMemo<ColumnDef<FlowRow>[]>(() => [
        { header: "Summa", accessorKey: "amount", cell: ({ row }) => <span className="text-green-600 font-medium whitespace-nowrap">+{formatMoney(Number(row.original.amount))}</span> },
        { header: "Reys", id: "route", cell: ({ row }) => route(row.original.loading_name, row.original.unloading_name) },
        { header: "To'lov turi", accessorKey: "payment_type_name", cell: ({ row }) => row.original.payment_type_name || "—" },
        { header: "Sana", accessorKey: "created", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.created)}</span> },
    ], [])
    const salaryCols = useMemo<ColumnDef<SalaryOrder>[]>(() => [
        { header: "Oylik", id: "amount", cell: ({ row }) => <span className="font-medium whitespace-nowrap">{formatMoney(salaries[row.original.order] ?? 0)}</span> },
        { header: "Reys", accessorKey: "route" },
        { header: "Holat", accessorKey: "status_label", cell: ({ row }) => row.original.status_label || "—" },
        { header: "Tarif bo'yicha", accessorKey: "tariff", cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{row.original.tariff != null ? formatMoney(Number(row.original.tariff)) : "—"}</span> },
        { header: "Sana", accessorKey: "date", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{row.original.date || "—"}</span> },
    ], [salaries])

    if (isLoading || !preview) return <p className="text-sm text-muted-foreground">Kassa hisobi yuklanmoqda…</p>

    const returns = due >= 0
    const diff = Math.abs(due) - amount
    const catList = (() => {
        const list = categories ?? []
        return selected?.category && !list.some((c) => c.id === selected.category)
            ? [...list, { id: selected.category, name: selected.category_name ?? `#${selected.category}` }]
            : list
    })()

    const tabLabel = (label: string, sum: number, extra?: ReactNode) => (
        <span className="flex items-center gap-1.5">
            {label}
            <span className="text-xs text-muted-foreground tabular-nums">{money(sum)}</span>
            {extra}
        </span>
    )

    return (
        <div className="flex flex-col gap-3">
            <Tabs value={inner} onValueChange={(v) => setInner(v as InnerTab)}>
                <TabsList className="w-full grid grid-cols-4 h-auto">
                    <TabsTrigger value="given">
                        {tabLabel("Kassadan berilgan", Number(preview.given), pendingCount ? <Badge variant="orange" className="h-5 px-1.5">{pendingCount}</Badge> : null)}
                    </TabsTrigger>
                    <TabsTrigger value="incomes">{tabLabel("Reys tushumlari", Number(preview.earned))}</TabsTrigger>
                    <TabsTrigger value="expenses">{tabLabel("Xarajatlar", Number(preview.spent))}</TabsTrigger>
                    <TabsTrigger value="salaries">{tabLabel("Oyliklar", salaryTotal)}</TabsTrigger>
                </TabsList>
            </Tabs>

            {pendingCount > 0 && (
                <div className="rounded-md border border-orange-500/30 bg-orange-500/5 px-3 py-2 text-sm text-orange-600">
                    {pendingCount} ta so'rov kassirda kutilmoqda: {money(pendingSum)} so'm. U hisobga kirmagan — haydovchiga hali berilmagan.
                </div>
            )}

            <div className="max-h-[38vh] overflow-y-auto">
                {inner === "given" && (
                    <>
                        <PendingAdvances tripId={tripId} />
                        <DataTable columns={advanceCols} data={advances} numeration viewAll />
                    </>
                )}
                {inner === "incomes" && <DataTable columns={incomeCols} data={incomes} numeration viewAll />}
                {inner === "expenses" && (
                    <DataTable
                        columns={expenseCols}
                        data={preview.expenses}
                        numeration
                        viewAll
                        onEdit={({ original }) => { setSelected(original); edit.openModal() }}
                        onDelete={({ original }) => { setSelected(original); del.openModal() }}
                    />
                )}
                {inner === "salaries" && (
                    <DataTable
                        columns={salaryCols}
                        data={salaryRows}
                        numeration
                        viewAll
                        onEdit={({ original }) => { setSalaryRow(original); salaryModal.openModal() }}
                    />
                )}
            </div>

            <div className="rounded-lg border px-3 py-1 divide-y">
                <div>
                    {Number(preview.prior) !== 0 && (
                        <Row label={Number(preview.prior) > 0 ? "Oldingi qarzi" : "Oldingi haqdorligi"} value={`${Number(preview.prior) > 0 ? "+" : "−"}${money(Math.abs(Number(preview.prior)))}`} />
                    )}
                    <Row label="Kassadan berilgan (avans + qo'shimcha)" value={`+${money(Number(preview.given))}`} />
                    <Row label="Reyslardan olgan pul (naqd)" value={`+${money(Number(preview.earned))}`} />
                    <Row label="Naqd xarajatlar" value={`−${money(Number(preview.spent))}`} />
                </div>
                <Row
                    className={cn("font-semibold", returns ? "text-green-600" : "text-destructive")}
                    label={returns ? "Hisob bo'yicha kassaga qaytarishi kerak" : "Hisob bo'yicha kassa haydovchiga beradi"}
                    value={`${money(Math.abs(due))} so'm`}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                    {returns ? "Haydovchi aslida topshiradigan summa" : "Kassa aslida beradigan summa"}
                    <input
                        className="h-10 rounded-md border bg-background px-3 text-sm font-normal tabular-nums"
                        value={paid === "" ? "" : money(Number(paid))}
                        onChange={(e) => setPaid(e.target.value === "" ? "" : digits(e.target.value))}
                    />
                    {diff !== 0 && (
                        <span className="text-xs font-normal text-orange-500">
                            Farq {money(Math.abs(diff))} so'm haydovchi balansida qoladi ({(returns ? diff > 0 : diff < 0) ? "qarzi" : "haqdorligi"}).
                        </span>
                    )}
                </label>
                <div className="flex flex-col gap-1.5 text-sm">
                    <label className="flex items-center gap-2 font-medium cursor-pointer">
                        <input type="checkbox" checked={salaryOn} onChange={(e) => setSalaryOn(e.target.checked)} className="size-4" />
                        Oylik so'rovi
                    </label>
                    <div className="h-10 rounded-md border bg-muted/40 px-3 flex items-center justify-between tabular-nums">
                        <span>{salaryOn ? money(salaryTotal) : "—"}</span>
                        <span className="text-xs text-muted-foreground">«Oyliklar» tabidagi jami</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Oylik qoldiqdan ayrilmaydi, kassadan alohida so'rov bilan beriladi.</span>
                </div>
            </div>

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
