import { FormCombobox } from "@/components/form/combobox"
import { FormDateTimePicker } from "@/components/form/form-datetime-picker"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { ReactNode, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import {
    ClosePreview,
    errorText,
    EXPENSE_TYPE_LABEL,
    ExpenseType,
    fmtDate,
    KassaRequest,
    KassaTrip,
    KassaTx,
    KIND_LABEL,
    KV2,
    KV2_CATEGORIES,
    KV2_INCOME,
    KV2_REQUESTS,
    KV2_TAKE,
    KV2_TRIPS,
    money,
    n,
    Overview,
    RequestKind,
    STATUS,
    useKassaDelete,
    useKassaPatch,
    useKassaPost,
    useOverview,
    VEHICLES_LIST,
    WAREHOUSES,
} from "./api"

export const M = {
    income: "kv2-income",
    deleteIncome: "kv2-income-delete",
    take: "kv2-take",
    request: "kv2-request",
    reject: "kv2-reject",
    reverse: "kv2-reverse",
    close: "kv2-close",
}

const amountRules = { validate: (v: unknown) => Number(v) > 0 || "Summa 0 dan katta bo'lsin" }

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

export const IncomeModal = ({ editing }: { editing: KassaTx | null }) => {
    const { closeModal, isOpen } = useModal(M.income)
    type F = { amount: number | ""; comment: string; date: string }
    const form = useForm<F>({ defaultValues: { amount: "", comment: "", date: toLocalInput(new Date().toISOString()) } })
    const post = useKassaPost(closeModal)
    const patch = useKassaPatch(closeModal)
    useEffect(() => {
        if (!isOpen) return
        form.reset(editing
            ? { amount: n(editing.amount), comment: editing.comment ?? "", date: toLocalInput(editing.created) }
            : { amount: "", comment: "", date: toLocalInput(new Date().toISOString()) })
    }, [isOpen, editing])
    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                const body = { amount: Number(v.amount), comment: v.comment || null, date: new Date(v.date.replace(" ", "T")).toISOString() }
                if (editing) patch.mutate(`${KV2_INCOME}/${editing.id}`, body, { onSuccess: () => toast.success("Kirim o'zgartirildi"), onError: onErr })
                else post.mutate(KV2_INCOME, body, { onSuccess: () => toast.success("Kassaga kirim qilindi"), onError: onErr })
            })}
        >
            <FormNumberInput required control={form.control} name="amount" label="Summa" placeholder="Ex: 1 000 000" thousandSeparator=" " allowNegative={false} registerOptions={amountRules} />
            <FormDateTimePicker required control={form.control} name="date" label="Sana" addButtonProps={{ className: "w-full justify-start text-left font-normal" }} />
            <FormTextarea label="Izoh" name="comment" methods={form} />
            {editing?.edited_at && <p className="text-xs text-muted-foreground">Oxirgi o'zgartirish: {fmtDate(editing.edited_at)}</p>}
            <Save label={editing ? "Saqlash" : "Kirim qilish"} loading={post.isPending || patch.isPending} />
        </form>
    )
}

export const DeleteIncomeModal = ({ row }: { row: KassaTx | null }) => {
    const { closeModal } = useModal(M.deleteIncome)
    const { data: ov } = useOverview()
    const del = useKassaDelete(closeModal)
    if (!row) return null
    const short = n(ov?.balance) < n(row.amount)
    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm">
                <b>{money(row.amount)} so'm</b> kirim ({fmtDate(row.created)}) o'chiriladi. Kassa qoldig'i shu summaga kamayadi.
            </p>
            {short && <p className="text-sm text-destructive">Kassada bu summa yo'q — o'chirib bo'lmaydi. Avval kassani to'ldiring.</p>}
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeModal}>Bekor qilish</Button>
                <Button
                    variant="destructive"
                    disabled={short}
                    loading={del.isPending}
                    onClick={() => del.mutate(`${KV2_INCOME}/${row.id}`, { onSuccess: () => toast.success("Kirim o'chirildi"), onError: onErr })}
                >
                    O'chirish
                </Button>
            </div>
        </div>
    )
}

export const ReverseModal = ({ row }: { row: KassaTx | null }) => {
    const { closeModal, isOpen } = useModal(M.reverse)
    const { data: ov } = useOverview()
    const post = useKassaPost(closeModal)
    const form = useForm<{ comment: string }>({ defaultValues: { comment: "" } })
    useEffect(() => { if (!isOpen) form.reset({ comment: "" }) }, [isOpen, form])
    if (!row) return null
    const short = row.dir === "in" && n(ov?.balance) < n(row.amount)
    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                if (!v.comment.trim()) return form.setError("comment", { message: "Sababni yozing" })
                post.mutate(`${KV2}/transactions/${row.id}/reverse`, { reason: v.comment.trim() }, {
                    onSuccess: () => toast.success("Amal bekor qilindi, teskari yozuv qo'shildi"),
                    onError: onErr,
                })
            })}
        >
            <p className="text-sm">
                <b>{row.dir === "in" ? "+" : "−"}{money(row.amount)} so'm</b> · {row.kind_label} · {row.party || "—"}
            </p>
            <p className="text-sm text-muted-foreground">
                Yozuv o'chirilmaydi. Teskari yozuv qo'shiladi: kassa {row.dir === "in" ? "kamayadi" : "ko'payadi"}
                {row.driver ? ", haydovchi balansi ham qaytariladi" : ""}.
            </p>
            {short && <p className="text-sm text-destructive">Kassada yetarli pul yo'q — bekor qilib bo'lmaydi.</p>}
            <FormTextarea required label="Sabab" name="comment" methods={form} />
            <div className="flex justify-end">
                <Button variant="destructive" className="min-w-32" type="submit" disabled={short} loading={post.isPending}>Bekor qilish</Button>
            </div>
        </form>
    )
}

export const TakeModal = () => {
    const { closeModal, isOpen } = useModal(M.take)
    const { data: ov } = useOverview()
    const post = useKassaPost(closeModal)
    const form = useForm<{ amount: number | ""; comment: string; driver: number | null }>({ defaultValues: { amount: "", comment: "", driver: null } })
    useEffect(() => { if (!isOpen) form.reset({ amount: "", comment: "", driver: null }) }, [isOpen, form])
    const options = (ov?.drivers ?? []).map((d) => ({ id: d.id, name: `${d.name} — balansi ${money(d.balance)}` }))
    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) =>
                post.mutate(KV2_TAKE, { driver: v.driver, amount: Number(v.amount), comment: v.comment || null }, {
                    onSuccess: () => toast.success("Kassaga kirim qilindi"),
                    onError: onErr,
                }),
            )}
        >
            <p className="text-sm text-muted-foreground">So'rovsiz olingan pul. Aylanmaga bog'lanmaydi — haydovchining umumiy balansidan ayriladi (eski qarz yoki depozit).</p>
            <FormCombobox required control={form.control} name="driver" label="Haydovchi" options={options} valueKey="id" labelKey="name" />
            <FormNumberInput required control={form.control} name="amount" label="Summa" placeholder="Ex: 1 000 000" thousandSeparator=" " allowNegative={false} registerOptions={amountRules} />
            <FormTextarea label="Izoh" name="comment" methods={form} />
            <Save label="Oldim" loading={post.isPending} />
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

const REQUEST_KIND_OPTIONS: { id: RequestKind; name: string }[] = [
    { id: "qoshimcha", name: "Avans" },
    { id: "oylik", name: "Oylik" },
    { id: "garaj_xarajat", name: "Texnik ko'rik" },
]

export const RequestModal = ({ editing }: { editing: KassaRequest | null }) => {
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
                if (garage && v.expense_type === "ombor" && !v.product.trim()) return form.setError("product", { message: "Nima olinayotganini yozing" })
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
                    post.mutate(`${KV2_REQUESTS}/${editing.id}/resend`, body, { onSuccess: () => toast.success(editing.status === STATUS.PENDING ? "So'rov o'zgartirildi" : "So'rov qayta yuborildi"), onError: onErr })
                else post.mutate(KV2_REQUESTS, body, { onSuccess: () => toast.success("So'rov kassirga yuborildi"), onError: onErr })
            })}
        >
            {editing?.rejected_comment && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
                    <span className="font-medium">Rad etish sababi: </span>{editing.rejected_comment}
                </div>
            )}
            {lockedKind ?
                <p className="text-sm">{KIND_LABEL[editing!.kind]} · {editing!.driver_name} · aylanma #{editing!.trip}</p>
            :   <FormCombobox required control={form.control} name="kind" label="So'rov turi" isSearch={false} isClearIcon={false} options={REQUEST_KIND_OPTIONS} valueKey="id" labelKey="name" />}
            {!garage && !lockedKind && (
                <FormCombobox required control={form.control} name="trip" label="Haydovchi (ochiq aylanmasi)" isClearIcon={false} options={tripOptions} valueKey="id" labelKey="name" />
            )}
            {garage && legacyGarage && (
                <FormCombobox
                    required
                    control={form.control}
                    name="expense_type"
                    label="Xarajat turi"
                    isSearch={false}
                    options={(Object.keys(EXPENSE_TYPE_LABEL) as ExpenseType[]).map((k) => ({ id: k, name: EXPENSE_TYPE_LABEL[k] }))}
                    valueKey="id"
                    labelKey="name"
                />
            )}
            {garage && (!legacyGarage || (expenseType && expenseType !== "ombor")) && (
                <FormCombobox required control={form.control} name="vehicle" label="Mashina" options={vehicleList} valueKey="id" labelKey="truck_number" />
            )}
            {garage && expenseType === "ombor" && (
                <>
                    <FormCombobox required control={form.control} name="warehouse" label="Ombor" isSearch={false} options={WAREHOUSES.map((w) => ({ id: w, name: w }))} valueKey="id" labelKey="name" />
                    <label className="flex flex-col gap-1.5 text-sm font-medium">
                        Nima olinadi (mahsulot / detal)
                        <input {...form.register("product")} placeholder="Masalan: moy filtri, 4 dona" className="h-10 rounded-md border bg-background px-3 text-sm font-normal" />
                        {form.formState.errors.product && <span className="text-xs text-destructive font-normal">{form.formState.errors.product.message}</span>}
                    </label>
                </>
            )}
            <FormNumberInput required control={form.control} name="amount" label="Summa" placeholder="Ex: 1 000 000" thousandSeparator=" " allowNegative={false} registerOptions={amountRules} />
            <FormTextarea label="Izoh" name="comment" methods={form} />
            <Save label={!editing ? "Yuborish" : editing.status === STATUS.PENDING ? "Saqlash" : "Qayta yuborish"} loading={post.isPending} />
        </form>
    )
}

export const RejectModal = ({ request }: { request: KassaRequest | null }) => {
    const { closeModal, isOpen } = useModal(M.reject)
    const post = useKassaPost(closeModal)
    const form = useForm<{ comment: string }>({ defaultValues: { comment: "" } })
    useEffect(() => { if (!isOpen) form.reset({ comment: "" }) }, [isOpen, form])
    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                if (!v.comment.trim()) return form.setError("comment", { message: "Sababni yozing" })
                if (request)
                    post.mutate(`${KV2_REQUESTS}/${request.id}/reject`, { rejected_comment: v.comment.trim() }, {
                        onSuccess: () => toast.success("So'rov rad etildi, operatorga qaytdi"),
                        onError: onErr,
                    })
            })}
        >
            <p className="text-sm text-muted-foreground">Summani o'zgartirib bo'lmaydi. Operator sababni ko'rib, tuzatib qayta yuboradi.</p>
            <FormTextarea required label="Sabab" name="comment" methods={form} />
            <div className="flex justify-end">
                <Button variant="destructive" className="min-w-32" type="submit" loading={post.isPending}>Rad etish</Button>
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
    const { closeModal, isOpen } = useModal(M.close)
    const post = useKassaPost(closeModal)
    const { data: preview } = useGet<ClosePreview>(`${KV2_TRIPS}/${trip?.id}/close-preview`, {
        enabled: isOpen && !!trip,
        options: { staleTime: 0, gcTime: 0 },
    })
    const { data: categories } = useGet<{ id: number; name: string }[]>(KV2_CATEGORIES, { enabled: isOpen })
    const [expenses, setExpenses] = useState<ExpenseEdit[]>([])
    const [paid, setPaid] = useState<number | "">("")
    const [salaryOn, setSalaryOn] = useState(true)
    const [salary, setSalary] = useState<number | "">("")

    useEffect(() => {
        if (!isOpen || !preview) return
        setExpenses(preview.expenses.map((e) => ({ id: e.id, amount: n(e.amount), category: e.category, comment: e.comment, date: e.date })))
        setSalaryOn(n(preview.salary_default) > 0)
        setSalary(n(preview.salary_default) || "")
    }, [isOpen, preview])

    const original = preview ? n(preview.spent) : 0
    const spent = expenses.reduce((a, e) => a + Math.abs(e.amount), 0)
    const due = preview ? n(preview.due) - (spent - original) : 0
    useEffect(() => { if (isOpen && preview) setPaid(Math.abs(due)) }, [isOpen, preview, due])

    if (!trip) return null
    if (!preview) return <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>
    const returns = due >= 0
    const amount = Number(paid || 0)
    const diff = Math.abs(due) - amount
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
                    amount,
                    salary: salaryOn ? Number(salary) || 0 : 0,
                    expenses: expenses.map((x) => ({ id: x.id, amount: x.amount, category: x.category, comment: x.comment })),
                }, {
                    onSuccess: (res: any) => toast.success(res?.status === "yopildi" ? "Aylanma yopildi (so'rovsiz)" : "Aylanma yopildi, so'rovlar kassirga yuborildi"),
                    onError: onErr,
                })
            }}
        >
            <p className="text-sm text-muted-foreground">{trip.driver_name} · {trip.plate ?? "—"}</p>

            <div className="rounded-lg border">
                <div className="px-3 py-2 text-sm font-medium border-b">Xarajatlar — tekshiring, xato bo'lsa tuzating</div>
                {expenses.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">Naqd xarajat yo'q</p>}
                {expenses.map((e) => {
                    const src = preview.expenses.find((x) => x.id === e.id)
                    return (
                        <div key={e.id} className="grid grid-cols-[1fr_130px] gap-2 px-3 py-2 border-b last:border-b-0">
                            <select value={e.category ?? ""} onChange={(ev) => setExp(e.id, { category: ev.target.value ? Number(ev.target.value) : null })} className={inputCls}>
                                {catOptions(e.category, src?.category_name).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input className={cn(inputCls, "text-right tabular-nums")} value={money(e.amount)} onChange={(ev) => setExp(e.id, { amount: Number(ev.target.value.replace(/\D/g, "")) })} />
                            <input className={cn(inputCls, "col-span-2 text-xs h-8")} placeholder="Izoh" value={e.comment ?? ""} onChange={(ev) => setExp(e.id, { comment: ev.target.value || null })} />
                            <span className="col-span-2 text-xs text-muted-foreground -mt-1">{fmtDate(e.date)}</span>
                        </div>
                    )
                })}
            </div>

            <div className="rounded-lg border px-3 py-1 divide-y">
                <div>
                    {n(preview.prior) !== 0 && <Row label={n(preview.prior) > 0 ? "Oldingi qarzi" : "Oldingi haqdorligi"} value={`${n(preview.prior) > 0 ? "+" : "−"}${money(Math.abs(n(preview.prior)))}`} />}
                    <Row label="Kassadan berilgan (avans + qo'shimcha)" value={`+${money(preview.given)}`} />
                    <Row label="Reyslardan olgan pul (naqd)" value={`+${money(preview.earned)}`} />
                    <Row label="Xarajatlar (naqd)" value={`−${money(spent)}`} />
                </div>
                <Row
                    className={cn("font-semibold", returns ? "text-green-600" : "text-destructive")}
                    label={returns ? "Hisob bo'yicha kassaga qaytarishi kerak" : "Hisob bo'yicha kassa haydovchiga beradi"}
                    value={`${money(Math.abs(due))} so'm`}
                />
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium">
                {returns ? "Haydovchi aslida topshiradigan summa" : "Kassa aslida beradigan summa"}
                <input
                    className="h-10 rounded-md border bg-background px-3 text-sm font-normal tabular-nums"
                    value={paid === "" ? "" : money(Number(paid))}
                    onChange={(e) => setPaid(e.target.value === "" ? "" : Number(e.target.value.replace(/\D/g, "")))}
                />
                {diff !== 0 && (
                    <span className="text-xs font-normal text-orange-500">
                        Farq {money(Math.abs(diff))} so'm haydovchi balansida qoladi ({(returns ? diff > 0 : diff < 0) ? "qarzi" : "haqdorligi"}) — keyingi aylanmada hisoblanadi.
                    </span>
                )}
            </label>

            <div className="rounded-lg border px-3 py-2 flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={salaryOn} onChange={(e) => setSalaryOn(e.target.checked)} className="size-4" />
                    Oylik so'rovi (hisoblangan: {money(preview.salary_default)})
                </label>
                {salaryOn && (
                    <input
                        className="h-10 rounded-md border bg-background px-3 text-sm tabular-nums"
                        value={salary === "" ? "" : money(Number(salary))}
                        onChange={(e) => setSalary(e.target.value === "" ? "" : Number(e.target.value.replace(/\D/g, "")))}
                    />
                )}
                <span className="text-xs text-muted-foreground">Jarima yoki bonus bo'lsa summani o'zgartiring. Oylik qoldiqdan ayrilmaydi, kassadan alohida beriladi.</span>
            </div>

            <Save label={amount === 0 ? "Aylanmani yopish" : "Yopish va so'rov yuborish"} loading={post.isPending} />
        </form>
    )
}

export type { Overview }
