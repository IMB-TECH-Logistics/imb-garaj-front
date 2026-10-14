import { FormCombobox } from "@/components/form/combobox"
import { FormDateTimePicker } from "@/components/form/form-datetime-picker"
import { FormMultiCombobox } from "@/components/form/multi-combobox"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { SETTINGS_SELECTABLE_USERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { ReactNode, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import {
    ClosePreview,
    errorText,
    EXPENSE_TYPE_LABEL_KEY,
    ExpenseType,
    fmtDate,
    KassaRequest,
    KassaTrip,
    KassaTx,
    KIND_DIR,
    KIND_LABEL_KEY,
    KV2,
    KV2_CATEGORIES,
    KV2_INCOME,
    KV2_EXPENSE,
    KV2_REQUESTS,
    KV2_TRIPS,
    money,
    n,
    Overview,
    RequestKind,
    STATUS,
    useKassaDelete,
    useKassaPatch,
    useKassaPost,
    VEHICLES_LIST,
    WAREHOUSES,
} from "./api"
import { CloseLines } from "./tables"

export const M = {
    income: "kv2-income",
    deleteIncome: "kv2-income-delete",
    request: "kv2-request",
    reject: "kv2-reject",
    reverse: "kv2-reverse",
    close: "kv2-close",
    pay: "kv2-pay",
}

const useAmountRules = () => {
    const { t } = useTranslation()
    return { validate: (v: unknown) => Number(v) > 0 || t("kassa.amount_gt_zero") }
}

const Save = ({ label, loading, disabled }: { label: string; loading?: boolean; disabled?: boolean }) => (
    <div className="flex justify-end mt-1">
        <Button className="min-w-32" type="submit" loading={loading} disabled={disabled}>{label}</Button>
    </div>
)

const inputCls = "h-9 rounded-md border bg-background px-2 text-sm w-full"

const toLocalInput = (iso: string) => {
    const d = new Date(iso)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
}

const onErr = (e: unknown) => toast.error(errorText(e))

export const IncomeModal = ({ editing, out = false }: { editing: KassaTx | null; out?: boolean }) => {
    const { t } = useTranslation()
    const amountRules = useAmountRules()
    const { closeModal, isOpen } = useModal(M.income)
    type F = { amount: number | ""; source: string; comment: string; date: string; vehicles: number[] }
    const form = useForm<F>({ defaultValues: { amount: "", source: "", comment: "", date: toLocalInput(new Date().toISOString()), vehicles: [] } })
    const { data: vehicleOptions } = useGet<{ id: number; name: string }[]>("selectable/vehicle", { params: { model_name: "vehicle" }, enabled: isOpen && out })
    const post = useKassaPost(closeModal)
    const patch = useKassaPatch(closeModal)
    const { data: users } = useGet<{ id: number; first_name?: string; last_name?: string; username?: string }[]>(SETTINGS_SELECTABLE_USERS, { params: { staff: 1 }, enabled: isOpen })
    const userOptions = useMemo(() => {
        const names = (users ?? []).map((u) => [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.username || "").filter(Boolean)
        const current = editing?.source
        return [...new Set(current ? [current, ...names] : names)].map((name) => ({ id: name, name }))
    }, [users, editing])
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
                const body = { amount: Number(v.amount), source: v.source || null, comment: v.comment || null, date: new Date(v.date.replace(" ", "T")).toISOString(), ...(out ? { vehicles: v.vehicles ?? [] } : {}) }
                const url = out ? KV2_EXPENSE : KV2_INCOME
                const done = out ? t("fin.kv2.cash_out_done") : t("fin.kv2.cash_in_done")
                if (editing) patch.mutate(`${url}/${editing.id}`, body, { onSuccess: () => toast.success(t("fin.kv2.income_updated")), onError: onErr })
                else post.mutate(url, body, { onSuccess: () => toast.success(done), onError: onErr })
            })}
        >
            <FormNumberInput required control={form.control} name="amount" label={t("form.amount")} placeholder={`${t("form.example")}: 1 000 000`} thousandSeparator=" " allowNegative={false} registerOptions={amountRules} />
            <FormDateTimePicker required control={form.control} name="date" label={t("form.date")} addButtonProps={{ className: "w-full justify-start text-left font-normal" }} />
            {!out && <FormCombobox control={form.control} name="source" label={t("fin.kv2.received_from")} options={userOptions} valueKey="id" labelKey="name" />}
            {out && (
                <div className="flex flex-col gap-1">
                    <FormMultiCombobox control={form.control} name="vehicles" label={t("fin.kv2.expense_vehicles")} placeholder={t("fin.kv2.expense_vehicles_placeholder")} options={vehicleOptions} valueKey="id" labelKey="name" />
                    <p className="text-xs text-muted-foreground">{t("fin.kv2.expense_vehicles_hint")}</p>
                </div>
            )}
            <FormTextarea label={t("form.comment")} name="comment" methods={form} />
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

type RequestForm = {
    kind: RequestKind
    amount: number | ""
    comment: string
    trip: number | null
    expense_type: ExpenseType | null
    vehicle: number | null
    warehouse: string | null
    product: string
}

export const RequestModal = ({ editing }: { editing: KassaRequest | null }) => {
    const { t } = useTranslation()
    const amountRules = useAmountRules()
    const requestKindOptions: { id: RequestKind; name: string }[] = [
        { id: "qoshimcha", name: t("form.advance") },
        { id: "oylik", name: t("table.monthly_salary") },
        { id: "garaj_xarajat", name: t("fin.kv2_expense_type.texnik_korik") },
    ]
    const { closeModal, isOpen } = useModal(M.request)
    const post = useKassaPost(closeModal)
    const { data: trips } = useGet<KassaTrip[]>(KV2_TRIPS, { enabled: isOpen })
    const { data: vehicles } = useGet<{ results?: { id: number; truck_number: string }[] } | { id: number; truck_number: string }[]>(VEHICLES_LIST, {
        params: { page_size: 500 },
        enabled: isOpen,
    })
    const vehicleList = Array.isArray(vehicles) ? vehicles : vehicles?.results ?? []
    const blank: RequestForm = { kind: "qoshimcha", amount: "", comment: "", trip: null, expense_type: null, vehicle: null, warehouse: null, product: "" }
    const form = useForm<RequestForm>({ defaultValues: blank })
    useEffect(() => {
        if (!isOpen) return form.reset(blank)
        if (editing)
            form.reset({
                kind: editing.kind,
                amount: n(editing.amount),
                comment: editing.comment ?? "",
                trip: editing.trip,
                expense_type: editing.expense_type,
                vehicle: editing.vehicle,
                warehouse: editing.warehouse,
                product: editing.product ?? "",
            })
    }, [isOpen, editing])
    const kind = form.watch("kind")
    const expenseType = form.watch("expense_type")
    const garage = kind === "garaj_xarajat"
    const legacyGarage = !!editing && editing.kind === "garaj_xarajat" && editing.expense_type !== "texnik_korik"
    const tripOptions = (trips ?? [])
        .filter((t) => t.status === "yolda" || t.status === "avans_kutilmoqda" || (editing && t.id === editing.trip))
        .map((t) => ({ id: t.id, name: `${t.driver_name} · #${t.id}${t.plate ? ` · ${t.plate}` : ""}` }))
    const lockedKind = !!editing && (editing.kind === "qaytarish" || editing.kind === "berish" || editing.kind === "avans" || editing.kind === "avans_qaytarish")

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                if (garage && !legacyGarage) v.expense_type = "texnik_korik"
                if (garage && v.expense_type === "ombor" && !v.product.trim()) return form.setError("product", { message: t("fin.kv2.enter_product") })
                const trip = (trips ?? []).find((t) => t.id === Number(v.trip))
                const body = {
                    kind: v.kind,
                    amount: Number(v.amount),
                    comment: v.comment || null,
                    ...(garage
                        ? {
                              expense_type: v.expense_type,
                              vehicle: v.expense_type !== "ombor" ? v.vehicle : null,
                              warehouse: v.expense_type === "ombor" ? v.warehouse : null,
                              product: v.expense_type === "ombor" ? v.product.trim() : null,
                          }
                        : { trip: trip?.id ?? null, driver: trip?.driver ?? null }),
                }
                if (editing)
                    post.mutate(`${KV2_REQUESTS}/${editing.id}/resend`, body, { onSuccess: () => toast.success(editing.status === STATUS.PENDING ? t("fin.kv2.request_changed") : t("fin.kv2.request_resent")), onError: onErr })
                else post.mutate(KV2_REQUESTS, body, { onSuccess: () => toast.success(t("fin.kv2.request_sent_cashier")), onError: onErr })
            })}
        >
            {editing?.rejected_comment && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
                    <span className="font-medium">{t("kassa.reject_reason")}: </span>{editing.rejected_comment}
                </div>
            )}
            {lockedKind ?
                <p className="text-sm">{t(KIND_LABEL_KEY[editing!.kind])} · {editing!.driver_name} · {t("fin.kv2.turnover_n", { id: editing!.trip })}</p>
            :   <FormCombobox required control={form.control} name="kind" label={t("fin.kv2.request_type")} isSearch={false} isClearIcon={false} options={requestKindOptions} valueKey="id" labelKey="name" />}
            {!garage && !lockedKind && (
                <FormCombobox required control={form.control} name="trip" label={t("fin.kv2.driver_open_turnover")} isClearIcon={false} options={tripOptions} valueKey="id" labelKey="name" />
            )}
            {garage && legacyGarage && (
                <FormCombobox
                    required
                    control={form.control}
                    name="expense_type"
                    label={t("form.expense_type")}
                    isSearch={false}
                    options={(Object.keys(EXPENSE_TYPE_LABEL_KEY) as ExpenseType[]).map((k) => ({ id: k, name: t(EXPENSE_TYPE_LABEL_KEY[k]) }))}
                    valueKey="id"
                    labelKey="name"
                />
            )}
            {garage && (!legacyGarage || (expenseType && expenseType !== "ombor")) && (
                <FormCombobox required control={form.control} name="vehicle" label={t("vst.vehicle_short")} options={vehicleList} valueKey="id" labelKey="truck_number" />
            )}
            {garage && expenseType === "ombor" && (
                <>
                    <FormCombobox required control={form.control} name="warehouse" label={t("fin.kv2.warehouse")} isSearch={false} options={WAREHOUSES.map((w) => ({ id: w, name: w }))} valueKey="id" labelKey="name" />
                    <label className="flex flex-col gap-1.5 text-sm font-medium">
                        {t("fin.kv2.product_label")}
                        <input {...form.register("product")} placeholder={t("fin.kv2.product_placeholder")} className="h-10 rounded-md border bg-background px-3 text-sm font-normal" />
                        {form.formState.errors.product && <span className="text-xs text-destructive font-normal">{form.formState.errors.product.message}</span>}
                    </label>
                </>
            )}
            <FormNumberInput required control={form.control} name="amount" label={t("form.amount")} placeholder={`${t("form.example")}: 1 000 000`} thousandSeparator=" " allowNegative={false} registerOptions={amountRules} />
            <FormTextarea label={t("form.comment")} name="comment" methods={form} />
            <Save label={!editing ? t("fin.kv2.send") : editing.status === STATUS.PENDING ? t("actions.save") : t("fin.kv2.resend")} loading={post.isPending} />
        </form>
    )
}

export const PayModal = ({ request }: { request: KassaRequest | null }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(M.pay)
    const post = useKassaPost(closeModal)
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
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeModal}>{t("actions.cancel")}</Button>
                <Button
                    className="min-w-32"
                    loading={post.isPending}
                    onClick={() => post.mutate(`${KV2_REQUESTS}/${request.id}/pay`, {}, { onSuccess: () => toast.success(out ? t("fin.kv2.paid_out_done") : t("fin.kv2.cash_in_done")), onError: onErr })}
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
    const { data: preview } = useGet<ClosePreview>(`${KV2_TRIPS}/${trip?.id}/close-preview`, {
        enabled: isOpen && !!trip,
        options: { staleTime: 0, gcTime: 0 },
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
                }, {
                    onSuccess: (res: any) => toast.success(res?.status === "yopildi" ? t("fin.kv2.close_toast_direct") : t("fin.kv2.close_toast_sent")),
                    onError: onErr,
                })
            }}
        >
            <p className="text-sm text-muted-foreground">{trip.driver_name} · {trip.plate ?? "—"}</p>

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
