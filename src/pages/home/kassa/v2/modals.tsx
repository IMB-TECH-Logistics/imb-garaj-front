import { FormCombobox } from "@/components/form/combobox"
import { FormDateTimePicker } from "@/components/form/form-datetime-picker"
import { FormMultiCombobox } from "@/components/form/multi-combobox"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { useInvestorsStore } from "@/pages/home/investors/store"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { ReactNode, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { keepPreviousData } from "@tanstack/react-query"
import PayDateField, { usePayDate } from "@/pages/home/managers/managers-trips/pay-date-field"
import CloseDateField from "@/pages/home/managers/managers-trips/close-date-field"
import SplitPreview from "@/pages/home/managers/managers-trips/split-preview"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import {
    ClosePreview,
    fmtDate,
    KassaRequest,
    KassaTrip,
    KassaTx,
    KIND_DIR,
    KV2,
    KV2_CATEGORIES,
    KV2_INCOME,
    KV2_EXPENSE,
    KV2_REQUESTS,
    KV2_TRIPS,
    money,
    n,
    Overview,
    useKassaDelete,
    useKassaPatch,
    useKassaPost,
} from "./api"
import { CloseLines } from "./tables"
import { M } from "./modal-keys"
import { useAmountRules, toLocalInput, onErr } from "./modal-utils"
import { Save } from "./modal-save"
export { M } from "./modal-keys"
export { RequestModal } from "./request-modal"

const inputCls = "h-9 rounded-md border bg-background px-2 text-sm w-full"

export const IncomeModal = ({ editing, out = false }: { editing: KassaTx | null; out?: boolean }) => {
    const { t } = useTranslation()
    const amountRules = useAmountRules()
    const { closeModal, isOpen } = useModal(M.income)
    type F = { amount: number | ""; source: string; comment: string; date: string; vehicles: number[] }
    const form = useForm<F>({ defaultValues: { amount: "", source: "", comment: "", date: toLocalInput(new Date().toISOString()), vehicles: [] } })
    const { data: vehicleOptions } = useGet<{ id: number; name: string }[]>("selectable/vehicle", { params: { model_name: "vehicle" }, enabled: isOpen && out })
    const post = useKassaPost(closeModal)
    const patch = useKassaPatch(closeModal)
    const investors = useInvestorsStore((s) => s.investors)
    const OTHER = "__other__"
    const sourceOptions = useMemo(() => {
        const names = investors.map((i) => i.name)
        const current = editing?.source
        const list = [...new Set(current ? [...names, current] : names)].map((name) => ({ id: name, name }))
        return [...list, { id: OTHER, name: t("fin.kv2.source_other") }]
    }, [investors, editing, t])
    const source = form.watch("source")
    useEffect(() => {
        if (!isOpen) return
        form.reset(editing
            ? { amount: n(editing.amount), source: editing.source ?? "", comment: editing.comment ?? "", date: toLocalInput(editing.created), vehicles: (editing.vehicles ?? []).map((v) => v.id) }
            : { amount: "", source: "", comment: "", date: toLocalInput(new Date().toISOString()), vehicles: [] })
    }, [isOpen, editing])
    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                if (!out && !v.source) return form.setError("source", { message: t("fin.kv2.choose_source") })
                if (!out && v.source === OTHER && !v.comment.trim()) return form.setError("comment", { message: t("fin.kv2.other_source_comment") })
                const body = { amount: Number(v.amount), source: v.source === OTHER ? null : v.source || null, comment: v.comment || null, date: new Date(v.date.replace(" ", "T")).toISOString(), ...(out ? { vehicles: v.vehicles ?? [] } : {}) }
                const url = out ? KV2_EXPENSE : KV2_INCOME
                const done = out ? t("fin.kv2.cash_out_done") : t("fin.kv2.cash_in_done")
                if (editing) patch.mutate(`${url}/${editing.id}`, body, { onSuccess: () => toast.success(t("fin.kv2.income_updated")), onError: onErr })
                else post.mutate(url, body, { onSuccess: () => toast.success(done), onError: onErr })
            })}
        >
            <FormNumberInput required control={form.control} name="amount" label={t("form.amount")} placeholder={`${t("form.example")}: 1 000 000`} thousandSeparator=" " allowNegative={false} registerOptions={amountRules} />
            <FormDateTimePicker required control={form.control} name="date" label={t("form.date")} addButtonProps={{ className: "w-full justify-start text-left font-normal" }} />
            {!out && <FormCombobox required control={form.control} name="source" label={t("fin.kv2.received_from")} options={sourceOptions} valueKey="id" labelKey="name" />}
            {out && (
                <div className="flex flex-col gap-1">
                    <FormMultiCombobox control={form.control} name="vehicles" label={t("fin.kv2.expense_vehicles")} placeholder={t("fin.kv2.expense_vehicles_placeholder")} options={vehicleOptions} valueKey="id" labelKey="name" />
                    <p className="text-xs text-muted-foreground">{t("fin.kv2.expense_vehicles_hint")}</p>
                </div>
            )}
            <FormTextarea
                required={!out && source === OTHER}
                label={t("form.comment")}
                name="comment"
                methods={form}
                placeholder={!out && source === OTHER ? t("fin.kv2.other_source_placeholder") : undefined}
            />
            {editing?.edited_at && <p className="text-xs text-muted-foreground">{t("fin.kv2.last_edit", { date: fmtDate(editing.edited_at) })}</p>}
            <Save label={editing ? t("actions.save") : out ? t("fin.kv2.record_expense") : t("fin.kv2.record_income")} loading={post.isPending || patch.isPending} />
        </form>
    )
}

export const DeleteIncomeModal = ({ row }: { row: KassaTx | null }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(M.deleteIncome)
    const del = useKassaDelete(closeModal)
    if (!row) return null
    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm">
                <b>{money(row.amount)} {t("page.som")}</b> {t("fin.kv2.delete_income_text", { date: fmtDate(row.created) })}
            </p>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeModal}>{t("actions.cancel")}</Button>
                <Button
                    variant="destructive"
                    loading={del.isPending}
                    onClick={() => del.mutate(`${KV2_INCOME}/${row.id}`, { onSuccess: () => toast.success(t("fin.kv2.income_deleted")), onError: onErr })}
                >
                    {t("actions.delete")}
                </Button>
            </div>
        </div>
    )
}

export const ReverseModal = ({ row }: { row: KassaTx | null }) => {
    const { t } = useTranslation()
    const { closeModal, isOpen } = useModal(M.reverse)
    const post = useKassaPost(closeModal)
    const form = useForm<{ comment: string }>({ defaultValues: { comment: "" } })
    useEffect(() => { if (!isOpen) form.reset({ comment: "" }) }, [isOpen, form])
    if (!row) return null
    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                if (!v.comment.trim()) return form.setError("comment", { message: t("fin.kv2.enter_reason") })
                post.mutate(`${KV2}/transactions/${row.id}/reverse`, { reason: v.comment.trim() }, {
                    onSuccess: () => toast.success(t("fin.kv2.reversed_ok")),
                    onError: onErr,
                })
            })}
        >
            <p className="text-sm">
                <b>{row.dir === "in" ? "+" : "−"}{money(row.amount)} {t("page.som")}</b> · {row.kind_label} · {row.party || "—"}
            </p>
            <p className="text-sm text-muted-foreground">
                {t(`fin.kv2.reverse_note_${row.dir}${row.driver ? "_driver" : ""}`)}
            </p>
            <FormTextarea required label={t("fin.kv2.reason")} name="comment" methods={form} />
            <div className="flex justify-end">
                <Button variant="destructive" className="min-w-32" type="submit" loading={post.isPending}>{t("fin.kv2.reverse_btn")}</Button>
            </div>
        </form>
    )
}

export const PayModal = ({ request }: { request: KassaRequest | null }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(M.pay)
    const post = useKassaPost(closeModal)
    const [payDate, setPayDate] = usePayDate(request?.trip_end, request?.id)
    if (!request) return null
    const out = KIND_DIR[request.kind] === "out"
    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm">
                <b>{money(request.amount)} {t("page.som")}</b> · {request.close ? t("fin.kv2.close_turnover_n", { id: request.trip }) : request.kind_label} · {request.driver_name || "—"}
            </p>
            {request.close && (
                <div className="rounded-lg border px-3 py-2">
                    <CloseLines c={request.close} />
                </div>
            )}
            <p className="text-sm text-muted-foreground">
                {request.close
                    ? out ? t("fin.kv2.pay_close_out", { amount: `${money(request.amount)} ${t("page.som")}` }) : t("fin.kv2.pay_close_in", { amount: `${money(request.amount)} ${t("page.som")}` })
                    : out ? t("fin.kv2.pay_out_text") : t("fin.kv2.pay_in_text")}
            </p>
            <PayDateField value={payDate} onChange={setPayDate} />
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeModal}>{t("actions.cancel")}</Button>
                <Button
                    className="min-w-32"
                    loading={post.isPending}
                    onClick={() => post.mutate(`${KV2_REQUESTS}/${request.id}/pay`, payDate ? { date: payDate } : {}, { onSuccess: () => toast.success(out ? t("fin.kv2.paid_out_done") : t("fin.kv2.cash_in_done")), onError: onErr })}
                >
                    {out ? t("vst.gave") : t("fin.kv2.received")}
                </Button>
            </div>
        </div>
    )
}

export const RejectModal = ({ request }: { request: KassaRequest | null }) => {
    const { t } = useTranslation()
    const { closeModal, isOpen } = useModal(M.reject)
    const post = useKassaPost(closeModal)
    const form = useForm<{ comment: string }>({ defaultValues: { comment: "" } })
    useEffect(() => { if (!isOpen) form.reset({ comment: "" }) }, [isOpen, form])
    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                if (!v.comment.trim()) return form.setError("comment", { message: t("fin.kv2.enter_reason") })
                if (request)
                    post.mutate(`${KV2_REQUESTS}/${request.id}/reject`, { rejected_comment: v.comment.trim() }, {
                        onSuccess: () => toast.success(t("fin.kv2.request_rejected_back")),
                        onError: onErr,
                    })
            })}
        >
            <p className="text-sm text-muted-foreground">{t("fin.kv2.reject_note")}</p>
            <FormTextarea required label={t("fin.kv2.reason")} name="comment" methods={form} />
            <div className="flex justify-end">
                <Button variant="destructive" className="min-w-32" type="submit" loading={post.isPending}>{t("kassa.reject")}</Button>
            </div>
        </form>
    )
}

const Row = ({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) => (
    <div className={cn("flex items-center justify-between gap-3 py-1.5 text-sm", className)}>
        <span>{label}</span>
        <span className="tabular-nums whitespace-nowrap">{value}</span>
    </div>
)

type ExpenseEdit = { id: number; amount: number; category: number | null; comment: string | null; date: string }

export const CloseTripModal = ({ trip }: { trip: KassaTrip | null }) => {
    const { t } = useTranslation()
    const { closeModal, isOpen } = useModal(M.close)
    const post = useKassaPost(closeModal)
    const [closeDate, setCloseDate] = useState("")
    useEffect(() => { if (!isOpen) setCloseDate("") }, [isOpen])
    const { data: preview } = useGet<ClosePreview>(`${KV2_TRIPS}/${trip?.id}/close-preview`, {
        params: { date: closeDate },
        enabled: isOpen && !!trip,
        options: { staleTime: 0, gcTime: 0, placeholderData: keepPreviousData },
    })
    const { data: categories } = useGet<{ id: number; name: string }[]>(KV2_CATEGORIES, { enabled: isOpen })
    const [expenses, setExpenses] = useState<ExpenseEdit[]>([])

    useEffect(() => {
        if (!isOpen || !preview) return
        setExpenses(preview.expenses.map((e) => ({ id: e.id, amount: n(e.amount), category: e.category, comment: e.comment, date: e.date })))
    }, [isOpen, preview])

    const original = preview ? n(preview.spent) : 0
    const spent = expenses.reduce((a, e) => a + Math.abs(e.amount), 0)
    const due = preview ? n(preview.due) - (spent - original) : 0

    if (!trip) return null
    if (!preview) return <p className="text-sm text-muted-foreground">{t("messages.loading")}</p>
    const salary = n(preview.salary_default)
    const net = due - salary
    const returns = net >= 0
    const setExp = (id: number, patch: Partial<ExpenseEdit>) => setExpenses((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    const catOptions = (current: number | null, name?: string | null) => {
        const list = categories ?? []
        return current && !list.some((c) => c.id === current) ? [...list, { id: current, name: name ?? `#${current}` }] : list
    }

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
                e.preventDefault()
                post.mutate(`${KV2_TRIPS}/${trip.id}/close`, {
                    expenses: expenses.map((x) => ({ id: x.id, amount: x.amount, category: x.category, comment: x.comment })),
                    ...(closeDate ? { date: closeDate } : {}),
                }, {
                    onSuccess: (res: any) => res?.new_trip ? toast.success(t("trips.finish.closed_new_trip", { id: trip.id, new: res.new_trip })) : toast.success(res?.status === "yopildi" ? t("fin.kv2.close_toast_direct") : t("fin.kv2.close_toast_sent")),
                    onError: onErr,
                })
            }}
        >
            <p className="text-sm text-muted-foreground">{trip.driver_name} · {trip.plate ?? "—"}</p>
            <CloseDateField value={closeDate} onChange={setCloseDate} />
            {closeDate && <SplitPreview tripId={trip.id} date={closeDate} />}

            <div className="rounded-lg border">
                <div className="px-3 py-2 text-sm font-medium border-b">{t("fin.kv2.expenses_check")}</div>
                {expenses.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">{t("fin.kv2.no_cash_expense")}</p>}
                {expenses.map((e) => {
                    const src = preview.expenses.find((x) => x.id === e.id)
                    return (
                        <div key={e.id} className="grid grid-cols-[1fr_130px] gap-2 px-3 py-2 border-b last:border-b-0">
                            <select value={e.category ?? ""} onChange={(ev) => setExp(e.id, { category: ev.target.value ? Number(ev.target.value) : null })} className={inputCls}>
                                {catOptions(e.category, src?.category_name).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input className={cn(inputCls, "text-right tabular-nums")} value={money(e.amount)} onChange={(ev) => setExp(e.id, { amount: Number(ev.target.value.replace(/\D/g, "")) })} />
                            <input className={cn(inputCls, "col-span-2 text-xs h-8")} placeholder={t("form.comment")} value={e.comment ?? ""} onChange={(ev) => setExp(e.id, { comment: ev.target.value || null })} />
                            <span className="col-span-2 text-xs text-muted-foreground -mt-1">{fmtDate(e.date)}</span>
                        </div>
                    )
                })}
            </div>

            <div className="rounded-lg border px-3 py-1 divide-y">
                <div>
                    <Row label={t("fin.kv2.given_from_cash")} value={`+${money(preview.given)}`} />
                    <Row label={t("fin.kv2.earned_from_trips")} value={`+${money(preview.earned)}`} />
                    <Row label={t("fin.kv2.expenses_cash")} value={`−${money(spent)}`} />
                </div>
                <Row label={t("fin.kv2.left_with_driver")} value={`${money(due)} ${t("page.som")}`} />
                <Row label={t("fin.kv2.salary_by_trips")} value={`−${money(salary)}`} />
                <Row
                    className={cn("font-semibold", returns ? "text-green-600" : "text-destructive")}
                    label={returns ? t("fin.kv2.takes_cap") : t("fin.kv2.gives_cap")}
                    value={`${money(Math.abs(net))} ${t("page.som")}`}
                />
            </div>
            <span className="text-xs text-muted-foreground">{t("fin.kv2.close_final_note")}</span>

            <Save label={due === 0 && salary === 0 ? t("fin.kv2.close_turnover") : t("fin.kv2.close_and_send")} loading={post.isPending} />
        </form>
    )
}

export type { Overview }
