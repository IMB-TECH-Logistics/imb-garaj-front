import Modal from "@/components/custom/modal"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MANAGERS_CASHFLOW, MANAGERS_TRIPS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatDateTime } from "@/lib/format-date"
import { formatMoney } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import { History } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

export const ADVANCE_ACTION = 2
const REQUESTS = "checkout/kassa-v2/requests"

export type RowExtras = {
    id: number
    amount: number
    action?: number
    comment?: string | null
    history_count?: number
    pending_change?: { id: number; type: "edit" | "delete" | "return"; amount: number | null } | null
}

type HistoryEntry = {
    id: number
    at: string
    user_name: string | null
    changes: { field: string; label: string; old: string | null; new: string | null }[]
}

const errorText = (e: any) => {
    const d = e?.response?.data
    if (!d) return "Xatolik yuz berdi"
    if (d.detail) return String(d.detail)
    const first = Object.values(d)[0]
    return Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : "Xatolik yuz berdi"
}

const useRefreshFinance = () => {
    const qc = useQueryClient()
    return () =>
        qc.invalidateQueries({
            predicate: (q) => {
                const k = String(q.queryKey[0])
                return k.includes("cashflow") || k.startsWith("checkout/kassa-v2") || k.startsWith(MANAGERS_TRIPS)
            },
        })
}

export function RowMarks({ row }: { row: RowExtras }) {
    const [open, setOpen] = useState(false)
    const pending = row.pending_change
    return (
        <>
            {!!row.history_count && (
                <button
                    type="button"
                    title="O'zgarishlar tarixi"
                    className="text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                        e.stopPropagation()
                        setOpen(true)
                    }}
                >
                    <History size={15} />
                </button>
            )}
            {pending && (
                <Badge variant="orange" className="w-fit whitespace-nowrap">
                    {pending.type === "delete" ?
                        "O'chirish kassirda kutilmoqda"
                    : pending.type === "return" ?
                        <>Qaytarish kutilmoqda:{" "}{formatMoney(Number(pending.amount ?? 0))}</>
                    :   <>O'zgartirish kutilmoqda:{" "}{formatMoney(Number(pending.amount ?? 0))}</>}
                </Badge>
            )}
            {open && <HistoryDialog id={row.id} onClose={() => setOpen(false)} />}
        </>
    )
}

function HistoryDialog({ id, onClose }: { id: number; onClose: () => void }) {
    const modalKey = `cashflow-history-${id}`
    const { openModal, closeModal, isOpen } = useModal(modalKey)
    const { data, isLoading } = useGet<HistoryEntry[]>(`${MANAGERS_CASHFLOW}/${id}/history`, {
        options: { staleTime: 0 },
    })
    useEffect(() => {
        openModal()
        return () => closeModal()
    }, [])
    useEffect(() => {
        if (isOpen === false) onClose()
    }, [isOpen])
    return (
        <Modal modalKey={modalKey} title="O'zgarishlar tarixi" size="max-w-lg">
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
                {isLoading && <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>}
                {!isLoading && !data?.length && <p className="text-sm text-muted-foreground">Tarix topilmadi.</p>}
                {data?.map((h) => (
                    <div key={h.id} className="rounded-lg border px-3 py-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{h.user_name || "—"}</span>
                            <span>{formatDateTime(h.at)}</span>
                        </div>
                        {h.changes.map((c, i) => (
                            <div key={i} className="grid grid-cols-[110px_1fr] gap-2 text-sm py-0.5">
                                <span className="text-muted-foreground">{c.label}</span>
                                <span>
                                    <span className="line-through text-muted-foreground">{c.old ?? "—"}</span>
                                    {" → "}
                                    <span className="font-medium">{c.new ?? "—"}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </Modal>
    )
}

export const ADVANCE_EDIT_MODAL = "advance-change-edit"
export const ADVANCE_DELETE_MODAL = "advance-change-delete"

export function AdvanceChangeModals({ row }: { row: RowExtras | null }) {
    const edit = useModal(ADVANCE_EDIT_MODAL)
    const del = useModal(ADVANCE_DELETE_MODAL)
    const refresh = useRefreshFinance()
    const { mutate, isPending } = usePost({ meta: { skipGlobalError: true } })
    const form = useForm<{ amount: number | ""; comment: string }>({ defaultValues: { amount: "", comment: "" } })
    const delForm = useForm<{ comment: string }>({ defaultValues: { comment: "" } })

    useEffect(() => {
        if (edit.isOpen && row) form.reset({ amount: Number(row.amount), comment: "" })
    }, [edit.isOpen, row])
    useEffect(() => {
        if (del.isOpen) delForm.reset({ comment: "" })
    }, [del.isOpen])

    return (
        <>
            <Modal modalKey={ADVANCE_EDIT_MODAL} title="Avansni o'zgartirish" size="max-w-md">
                <form
                    className="flex flex-col gap-3"
                    onSubmit={form.handleSubmit((v) => {
                        if (!row) return
                        mutate(REQUESTS, { kind: "avans_tuzatish", cash_flow: row.id, amount: Number(v.amount), comment: v.comment || null }, {
                            onSuccess: () => {
                                toast.success("O'zgartirish so'rovi kassirga yuborildi")
                                refresh()
                                edit.closeModal()
                            },
                            onError: (e: unknown) => toast.error(errorText(e)),
                        })
                    })}
                >
                    <p className="text-sm text-muted-foreground">
                        Hozirgi summa: <b>{formatMoney(Number(row?.amount ?? 0))} so'm</b>. Avans kassadan berilgan, shuning uchun o'zgartirish kassir tasdiqlagandan keyin kuchga kiradi.
                    </p>
                    <FormNumberInput
                        required
                        control={form.control}
                        name="amount"
                        label="Yangi summa"
                        thousandSeparator=" "
                        allowNegative={false}
                        registerOptions={{ validate: (v: unknown) => Number(v) > 0 || "Summa 0 dan katta bo'lsin" }}
                    />
                    <FormTextarea required label="Sabab" name="comment" methods={form} />
                    <div className="flex justify-end">
                        <Button type="submit" className="min-w-32" loading={isPending}>Kassirga yuborish</Button>
                    </div>
                </form>
            </Modal>

            <Modal modalKey={ADVANCE_DELETE_MODAL} title="Avansni o'chirish" size="max-w-md">
                <form
                    className="flex flex-col gap-3"
                    onSubmit={delForm.handleSubmit((v) => {
                        if (!row) return
                        if (!v.comment.trim()) return delForm.setError("comment", { message: "Sababni yozing" })
                        mutate(REQUESTS, { kind: "avans_bekor", cash_flow: row.id, comment: v.comment.trim() }, {
                            onSuccess: () => {
                                toast.success("O'chirish so'rovi kassirga yuborildi")
                                refresh()
                                del.closeModal()
                            },
                            onError: (e: unknown) => toast.error(errorText(e)),
                        })
                    })}
                >
                    <p className="text-sm">
                        <b>{formatMoney(Number(row?.amount ?? 0))} so'm</b> avans o'chiriladi. Kassir tasdiqlasa, pul kassaga qaytgan hisoblanadi va avans haydovchidan olib tashlanadi.
                    </p>
                    <FormTextarea required label="Sabab" name="comment" methods={delForm} />
                    <div className="flex justify-end">
                        <Button type="submit" variant="destructive" className="min-w-32" loading={isPending}>Kassirga yuborish</Button>
                    </div>
                </form>
            </Modal>
        </>
    )
}

export const SALARY_REQUEST_MODAL = "salary-request"

export function SalaryRequestModal({ tripId, driverId }: { tripId?: number; driverId?: number }) {
    const modal = useModal(SALARY_REQUEST_MODAL)
    const refresh = useRefreshFinance()
    const { mutate, isPending } = usePost({ meta: { skipGlobalError: true } })
    const form = useForm<{ amount: number | ""; comment: string }>({ defaultValues: { amount: "", comment: "" } })
    useEffect(() => {
        if (modal.isOpen) form.reset({ amount: "", comment: "" })
    }, [modal.isOpen])
    return (
        <Modal modalKey={SALARY_REQUEST_MODAL} title="Oylik so'rash" size="max-w-md">
            <form
                className="flex flex-col gap-3"
                onSubmit={form.handleSubmit((v) => {
                    mutate(REQUESTS, { kind: "oylik", trip: tripId, driver: driverId, amount: Number(v.amount), comment: v.comment || null }, {
                        onSuccess: () => {
                            toast.success("Oylik so'rovi kassirga yuborildi")
                            refresh()
                            modal.closeModal()
                        },
                        onError: (e: unknown) => toast.error(errorText(e)),
                    })
                })}
            >
                <FormNumberInput
                    required
                    control={form.control}
                    name="amount"
                    label="Summa"
                    thousandSeparator=" "
                    allowNegative={false}
                    registerOptions={{ validate: (v: unknown) => Number(v) > 0 || "Summa 0 dan katta bo'lsin" }}
                />
                <FormTextarea label="Izoh" name="comment" methods={form} />
                <div className="flex justify-end">
                    <Button type="submit" className="min-w-32" loading={isPending}>Kassirga yuborish</Button>
                </div>
            </form>
        </Modal>
    )
}


export const ADVANCE_RETURN_MODAL = "advance-return"

type ReturnRequest = { id: number; status: number; amount: string; comment: string | null; rejected_comment: string | null; created: string; target_cash_flow?: number | null }

export function AdvanceReturns({ tripId, advanceId }: { tripId?: number; advanceId: number }) {
    const { data } = useGet<{ results: ReturnRequest[] }>(REQUESTS, {
        params: { trip: tripId, kind: "avans_qaytarish", status: "10,-10,20" },
        enabled: !!tripId,
    })
    const rows = (data?.results ?? []).filter((r) => r.target_cash_flow === advanceId)
    if (!rows.length) return null
    return (
        <div className="flex flex-col gap-1.5 mb-3">
            {rows.map((r) => {
                const label = r.status === 20 ? "Qaytarildi" : r.status === -10 ? "Rad etildi" : "Kassir tasdig'i kutilmoqda"
                const variant = r.status === 20 ? "default" : r.status === -10 ? "destructive" : "orange"
                return (
                    <div key={r.id} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                        <span className="font-medium tabular-nums text-green-600">+ {formatMoney(Number(r.amount))}</span>
                        <span>Qoldiq kassaga qaytarildi</span>
                        <Badge variant={variant as any} className="w-fit whitespace-nowrap">{label}</Badge>
                        {r.status === -10 && r.rejected_comment && <span className="text-xs text-muted-foreground">Sabab: {r.rejected_comment}</span>}
                        <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(r.created)}</span>
                    </div>
                )
            })}
        </div>
    )
}

export function AdvanceReturnModal({ advanceId, left }: { advanceId: number | null; left: number }) {
    const modal = useModal(ADVANCE_RETURN_MODAL)
    const refresh = useRefreshFinance()
    const { mutate, isPending } = usePost({ meta: { skipGlobalError: true } })
    const form = useForm<{ amount: number | ""; comment: string }>({ defaultValues: { amount: "", comment: "" } })
    useEffect(() => {
        if (modal.isOpen) form.reset({ amount: left > 0 ? left : "", comment: "" })
    }, [modal.isOpen, left])
    return (
        <Modal modalKey={ADVANCE_RETURN_MODAL} title="Avans qoldig'ini qaytarish" size="max-w-md">
            <form
                className="flex flex-col gap-3"
                onSubmit={form.handleSubmit((v) => {
                    if (!advanceId) return
                    mutate(REQUESTS, { kind: "avans_qaytarish", cash_flow: advanceId, amount: Number(v.amount), comment: v.comment || null }, {
                        onSuccess: () => {
                            toast.success("Qaytarish so'rovi kassirga yuborildi")
                            refresh()
                            modal.closeModal()
                        },
                        onError: (e: unknown) => toast.error(errorText(e)),
                    })
                })}
            >
                <p className="text-sm text-muted-foreground">
                    Avansdan qolgan: <b>{formatMoney(left)} so'm</b>. Haydovchi pulni kassirga topshiradi, kassir «Oldim» bosgach kassaga kirim bo'ladi.
                </p>
                <div className="flex justify-end -mb-2">
                    <Button type="button" size="sm" variant="secondary" disabled={left <= 0} onClick={() => form.setValue("amount", left, { shouldValidate: true })}>
                        Qoldiqni qo'yish: {formatMoney(Math.max(left, 0))}
                    </Button>
                </div>
                <FormNumberInput
                    required
                    control={form.control}
                    name="amount"
                    label="Qaytariladigan summa"
                    thousandSeparator=" "
                    allowNegative={false}
                    registerOptions={{ validate: (v: unknown) => Number(v) > 0 || "Summa 0 dan katta bo'lsin" }}
                />
                <FormTextarea label="Izoh" name="comment" methods={form} />
                <div className="flex justify-end">
                    <Button type="submit" className="min-w-32" loading={isPending}>Kassirga yuborish</Button>
                </div>
            </form>
        </Modal>
    )
}
