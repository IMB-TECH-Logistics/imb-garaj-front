import Modal from "@/components/custom/modal"
import TableActions from "@/components/custom/table-actions"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MANAGERS_CASHFLOW, MANAGERS_TRIPS } from "@/constants/api-endpoints"
import { useHasAction, useUser } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

const REQUESTS = "checkout/kassa-v2/requests"
const PENDING = 10
const REJECTED = -10

type AdvanceRequest = {
    id: number
    kind: "avans" | "qoshimcha"
    kind_label: string
    status: number
    amount: string
    comment: string | null
    rejected_comment: string | null
    created: string
}

const errorText = (e: any) => {
    const d = e?.response?.data
    if (!d) return "Xatolik yuz berdi"
    if (d.detail) return String(d.detail)
    const first = Object.values(d)[0]
    return Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : "Xatolik yuz berdi"
}

export default function PendingAdvances({ tripId }: { tripId?: number }) {
    const { data: user } = useUser()
    const isV2 = user?.kassa_mode === "driver_cash" && user?.kassa_version === 2
    const canEdit = useHasAction("kassa_operator_control" as never)
    const qc = useQueryClient()
    const [selected, setSelected] = useState<AdvanceRequest | null>(null)
    const edit = useModal("kv2-advance-edit")
    const cancel = useModal("kv2-advance-cancel")

    const { data } = useGet<{ results: AdvanceRequest[] }>(REQUESTS, {
        params: { trip: tripId, kind: "avans,qoshimcha", status: `${PENDING},${REJECTED}` },
        enabled: isV2 && !!tripId,
    })

    const refresh = () =>
        qc.invalidateQueries({
            predicate: (q) => {
                const k = q.queryKey[0]
                return typeof k === "string" && (k.startsWith("checkout/kassa-v2") || k.startsWith(MANAGERS_CASHFLOW) || k.startsWith(MANAGERS_TRIPS))
            },
        })

    const { mutate, isPending } = usePost({ meta: { skipGlobalError: true } })

    const form = useForm<{ amount: number | ""; comment: string }>({ defaultValues: { amount: "", comment: "" } })
    useEffect(() => {
        if (edit.isOpen && selected) form.reset({ amount: Number(selected.amount), comment: selected.comment ?? "" })
    }, [edit.isOpen, selected])

    const rows = data?.results ?? []
    if (!isV2 || !rows.length) return null

    return (
        <div className="flex flex-col gap-2 mb-3">
            {rows.map((r) => {
                const rejected = r.status === REJECTED
                return (
                    <div
                        key={r.id}
                        className={
                            rejected
                                ? "rounded-lg border border-red-600/30 bg-red-600/5 px-3 py-2"
                                : "rounded-lg border border-orange-500/30 bg-orange-500/5 px-3 py-2"
                        }
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="font-semibold tabular-nums whitespace-nowrap">
                                    +{formatMoney(Number(r.amount))}
                                </span>
                                <span className="text-sm">{r.kind_label}</span>
                                <Badge variant={rejected ? "destructive" : "orange"} className="w-fit whitespace-nowrap">
                                    {rejected ? "Rad etildi" : "Kassir tasdig'i kutilmoqda"}
                                </Badge>
                            </div>
                            {canEdit && (
                                rejected ?
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" className="h-8" onClick={() => { setSelected(r); edit.openModal() }}>
                                            Tuzatib qayta yuborish
                                        </Button>
                                        <TableActions onDelete={() => { setSelected(r); cancel.openModal() }} />
                                    </div>
                                :   <TableActions
                                        onEdit={() => { setSelected(r); edit.openModal() }}
                                        onDelete={() => { setSelected(r); cancel.openModal() }}
                                    />
                            )}
                        </div>
                        {rejected && r.rejected_comment && (
                            <p className="text-xs text-muted-foreground mt-1">Sabab: {r.rejected_comment}</p>
                        )}
                        {!rejected && r.comment && <p className="text-xs text-muted-foreground mt-1">{r.comment}</p>}
                    </div>
                )
            })}

            <Modal
                modalKey="kv2-advance-edit"
                title={selected?.status === REJECTED ? "So'rovni tuzatish" : "So'rovni tahrirlash"}
                size="max-w-md"
            >
                <form
                    className="flex flex-col gap-3"
                    onSubmit={form.handleSubmit((v) => {
                        if (!selected) return
                        mutate(`${REQUESTS}/${selected.id}/resend`, { amount: Number(v.amount), comment: v.comment || null }, {
                            onSuccess: () => {
                                toast.success(selected.status === REJECTED ? "So'rov qayta yuborildi" : "So'rov o'zgartirildi")
                                refresh()
                                edit.closeModal()
                            },
                            onError: (e: unknown) => toast.error(errorText(e)),
                        })
                    })}
                >
                    {selected?.status === REJECTED && selected.rejected_comment && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
                            <span className="font-medium">Rad etish sababi: </span>{selected.rejected_comment}
                        </div>
                    )}
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
                        <Button type="submit" className="min-w-32" loading={isPending}>
                            {selected?.status === REJECTED ? "Qayta yuborish" : "Saqlash"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal modalKey="kv2-advance-cancel" title="So'rovni bekor qilish" size="max-w-md">
                <div className="flex flex-col gap-4">
                    <p className="text-sm">
                        <b>{formatMoney(Number(selected?.amount ?? 0))} so'm</b> {selected?.kind_label.toLowerCase()} so'rovi bekor qilinadi. Kassirga bormaydi.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={cancel.closeModal}>Yo'q</Button>
                        <Button
                            variant="destructive"
                            loading={isPending}
                            onClick={() =>
                                selected &&
                                mutate(`${REQUESTS}/${selected.id}/cancel`, {}, {
                                    onSuccess: () => {
                                        toast.success("So'rov bekor qilindi")
                                        refresh()
                                        cancel.closeModal()
                                    },
                                    onError: (e: unknown) => toast.error(errorText(e)),
                                })
                            }
                        >
                            Bekor qilish
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
