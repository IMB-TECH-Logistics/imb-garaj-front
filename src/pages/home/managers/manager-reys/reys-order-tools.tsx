import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { MANAGERS_ORDERS, MANAGERS_TRIPS } from "@/constants/api-endpoints"
import { useConfirm } from "@/hooks/useConfirm"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { format } from "date-fns"
import { ArrowDown, ArrowUp } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export const GPS_SEQUENCE_MODAL_KEY = `${MANAGERS_TRIPS}-gps-sequence`
export const LOGISTICS_IMPORT_MODAL_KEY = `${MANAGERS_ORDERS}-import-logistics`

const COMPLETED = 2
const REYS = 1
const BUSY = 1

type SequenceRow = {
    order: number
    route: string
    moved: boolean
    will_change: boolean
    old_loading: string | null
    old_completed: string | null
    new_loading: string
    new_completed: string
}

type SequencePlan = {
    trusted: boolean
    locked: boolean
    breaks_before: number
    breaks_after: number
    moved: number[]
    rows: SequenceRow[]
    unresolved: { order: number; route: string }[]
    skipped: { order: number; route: string; reason: string }[]
    applied: number
}

const fmt = (value?: string | null) => {
    if (!value) return "—"
    const date = new Date(value)
    return isNaN(date.getTime()) ? "—" : format(date, "dd.MM HH:mm")
}

const errorText = (error: any, fallback: string) =>
    error?.response?.data?.detail || error?.response?.data?.code?.[0] || fallback

function useRefreshTrip() {
    const queryClient = useQueryClient()
    return () => {
        queryClient.invalidateQueries({ queryKey: [MANAGERS_ORDERS] })
        queryClient.invalidateQueries({ queryKey: [MANAGERS_TRIPS] })
    }
}

/** Reys tugagan yukli reysmi — faqat shular almashtiriladi. */
export const isSwappable = (r: ManagerOrders) => {
    const row = r as any
    return !row.__leg && !row.__idle && !row.__garage && r.activity === REYS && r.type === BUSY && r.status === COMPLETED
}

export function GpsSequenceModal({ tripId }: { tripId?: string }) {
    const { t } = useTranslation()
    const refresh = useRefreshTrip()
    const { closeModal, isOpen } = useModal(GPS_SEQUENCE_MODAL_KEY)
    const { mutate, isPending } = usePost({})
    const [plan, setPlan] = useState<SequencePlan | null>(null)
    const [error, setError] = useState<string | null>(null)

    const run = (apply: boolean) => {
        if (!tripId) return
        setError(null)
        mutate(
            `${MANAGERS_TRIPS}/${tripId}/gps-sequence`,
            { apply },
            {
                onSuccess: (data: SequencePlan) => {
                    setPlan(data)
                    if (apply) {
                        toast.success(t("reys_order.applied", { count: data.applied }))
                        refresh()
                        closeModal()
                    }
                },
                onError: (e: any) => setError(errorText(e, t("reys_order.gps_error"))),
            },
        )
    }

    useEffect(() => {
        if (isOpen) {
            setPlan(null)
            run(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, tripId])

    const canApply = !!plan && plan.trusted && !plan.locked && plan.rows.some((r) => r.will_change)

    return (
        <Modal size="max-w-3xl" modalKey={GPS_SEQUENCE_MODAL_KEY} titleInChildren>
            <div className="flex flex-col gap-4">
                <DialogHeader>
                    <DialogTitle className="font-normal">{t("reys_order.gps_title")}</DialogTitle>
                    <DialogDescription>{t("reys_order.gps_hint")}</DialogDescription>
                </DialogHeader>

                {isPending && !plan && <p className="text-sm text-muted-foreground">{t("reys_order.gps_loading")}</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}

                {plan && (
                    <>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            {plan.moved.length === 0 ? (
                                <Badge variant="secondary">{t("reys_order.gps_ok")}</Badge>
                            ) : plan.trusted ? (
                                <Badge className="bg-green-600 text-white">{t("reys_order.gps_trusted")}</Badge>
                            ) : (
                                <Badge variant="destructive">{t("reys_order.gps_untrusted")}</Badge>
                            )}
                            <span className="text-muted-foreground">
                                {t("reys_order.breaks", { before: plan.breaks_before, after: plan.breaks_after })}
                            </span>
                            {plan.locked && <Badge variant="outline">{t("trips.reys_cols.trip_locked")}</Badge>}
                        </div>

                        <div className="max-h-[50vh] overflow-auto rounded border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="p-2">#</th>
                                        <th className="p-2">{t("reys_order.route")}</th>
                                        <th className="p-2">{t("reys_order.loading")}</th>
                                        <th className="p-2">{t("reys_order.completed")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plan.rows.map((row, i) => (
                                        <tr key={row.order} className={row.moved ? "bg-amber-500/10 font-medium" : ""}>
                                            <td className="p-2">{i + 1}</td>
                                            <td className="p-2">
                                                {row.route} <span className="text-muted-foreground">#{row.order}</span>
                                            </td>
                                            <td className="p-2 whitespace-nowrap">
                                                {row.will_change ? (
                                                    <>
                                                        <s className="text-muted-foreground">{fmt(row.old_loading)}</s> → {fmt(row.new_loading)}
                                                    </>
                                                ) : (
                                                    fmt(row.old_loading)
                                                )}
                                            </td>
                                            <td className="p-2 whitespace-nowrap">
                                                {row.will_change ? (
                                                    <>
                                                        <s className="text-muted-foreground">{fmt(row.old_completed)}</s> → {fmt(row.new_completed)}
                                                    </>
                                                ) : (
                                                    fmt(row.old_completed)
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {plan.unresolved.length + plan.skipped.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                                <p className="font-medium">{t("reys_order.not_checked")}</p>
                                {plan.unresolved.map((r) => (
                                    <p key={r.order}>
                                        #{r.order} {r.route} — {t("reys_order.no_gps_match")}
                                    </p>
                                ))}
                                {plan.skipped.map((r) => (
                                    <p key={r.order}>
                                        #{r.order} {r.route} — {r.reason}
                                    </p>
                                ))}
                            </div>
                        )}
                    </>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={closeModal}>
                        {t("actions.cancel")}
                    </Button>
                    <Button type="button" disabled={!canApply || isPending} loading={isPending && !!plan} onClick={() => run(true)}>
                        {t("reys_order.apply")}
                    </Button>
                </DialogFooter>
            </div>
        </Modal>
    )
}

type ImportResult = { created: boolean; order: number; trip: number | null; vehicle: string | null; route: string; date: string | null }

export function LogisticsImportModal({ tripId }: { tripId?: string }) {
    const { t } = useTranslation()
    const refresh = useRefreshTrip()
    const { closeModal } = useModal(LOGISTICS_IMPORT_MODAL_KEY)
    const { mutate, isPending } = usePost({})
    const [code, setCode] = useState("")
    const [result, setResult] = useState<ImportResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const valid = /^[0-9A-Za-z]{4,10}$/.test(code.trim())

    const reset = () => {
        setCode("")
        setResult(null)
        setError(null)
    }

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!valid) return
        setError(null)
        setResult(null)
        mutate(
            `${MANAGERS_ORDERS}/import-logistics`,
            { code: code.trim().toUpperCase() },
            {
                onSuccess: (data: ImportResult) => {
                    setResult(data)
                    if (data.created) {
                        toast.success(t("reys_order.import_done"))
                        refresh()
                    }
                },
                onError: (err: any) => setError(errorText(err, t("reys_order.import_error"))),
            },
        )
    }

    return (
        <Modal size="max-w-md" modalKey={LOGISTICS_IMPORT_MODAL_KEY} titleInChildren onClose={reset}>
            <form onSubmit={submit} className="flex flex-col gap-4">
                <DialogHeader>
                    <DialogTitle className="font-normal">{t("reys_order.import_title")}</DialogTitle>
                    <DialogDescription>{t("reys_order.import_hint")}</DialogDescription>
                </DialogHeader>
                <Input
                    autoFocus
                    value={code}
                    maxLength={10}
                    placeholder="600CRI"
                    className="uppercase tracking-widest"
                    onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                {result && (
                    <div className="rounded border p-3 text-sm">
                        <p className="font-medium">
                            {result.created ? t("reys_order.import_done") : t("reys_order.import_exists")}
                        </p>
                        <p>
                            {result.vehicle} · {result.route} · {result.date}
                        </p>
                        {result.trip && String(result.trip) !== String(tripId) && (
                            <Link
                                to="/manager-trips/manager-reys/$id"
                                params={{ id: String(result.trip) }}
                                className="text-primary underline"
                                onClick={closeModal}
                            >
                                {t("reys_order.open_trip", { id: result.trip })}
                            </Link>
                        )}
                    </div>
                )}
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={closeModal}>
                        {t("actions.cancel")}
                    </Button>
                    <Button type="submit" disabled={!valid || isPending} loading={isPending}>
                        {t("reys_order.import_submit")}
                    </Button>
                </DialogFooter>
            </form>
        </Modal>
    )
}

type SwapPreview = {
    breaks_before: number
    breaks_after: number
    worse: boolean
    impossible: { from_place: string; to_place: string; km: number; minutes: number; need_minutes: number }[]
}

const hm = (t: (k: string, o?: any) => string, minutes: number) =>
    minutes >= 60 ? t("reys_order.hm", { h: Math.floor(minutes / 60), m: minutes % 60 }) : t("reys_order.m", { m: minutes })

/** ↑ / ↓ — qo'shni tugagan reys bilan o'rin (holat vaqtlari) almashtirish.
 *  Avval oldindan ko'rish: zanjir uzilishi va imkonsiz bo'sh yurishlar ogohlantiriladi,
 *  qarorni menejer qiladi. */
export function useSwapOrders(tripId?: string) {
    const { t } = useTranslation()
    const refresh = useRefreshTrip()
    const confirm = useConfirm()
    const { mutate, mutateAsync, isPending } = usePost({})

    const swap = async (current: ManagerOrders, other?: ManagerOrders) => {
        if (!tripId || !other) return
        const url = `${MANAGERS_TRIPS}/${tripId}/swap-orders`
        let preview: SwapPreview
        try {
            preview = await mutateAsync(url, { first: current.id, second: other.id, preview: true })
        } catch (e: any) {
            toast.error(errorText(e, t("reys_order.swap_error")))
            return
        }
        const ok = await confirm({
            title: preview.worse ? t("reys_order.swap_worse_title") : t("reys_order.swap_title"),
            description: (
                <span className="flex flex-col gap-2 text-left">
                    <span>
                        {current.loading_name} → {current.unloading_name} ⇄ {other.loading_name} → {other.unloading_name}
                    </span>
                    <span className={preview.breaks_after > preview.breaks_before ? "font-medium text-destructive" : preview.breaks_after < preview.breaks_before ? "font-medium text-green-600" : ""}>
                        {t("reys_order.breaks", { before: preview.breaks_before, after: preview.breaks_after })}
                    </span>
                    {preview.impossible.map((row) => (
                        <span key={`${row.from_place}-${row.to_place}-${row.minutes}`} className="font-medium text-destructive">
                            ⚠ {t("reys_order.impossible_leg", {
                                from: row.from_place,
                                to: row.to_place,
                                km: Math.round(row.km),
                                time: hm(t, row.minutes),
                                need: hm(t, row.need_minutes),
                            })}
                        </span>
                    ))}
                    {preview.worse && <span>{t("reys_order.swap_worse_hint")}</span>}
                </span>
            ),
        })
        if (!ok) return
        mutate(
            url,
            { first: current.id, second: other.id },
            {
                onSuccess: () => {
                    toast.success(t("reys_order.swapped"))
                    refresh()
                },
                onError: (e: any) => toast.error(errorText(e, t("reys_order.swap_error"))),
            },
        )
    }
    return { swap, isPending }
}

export function SwapArrows({
    onUp,
    onDown,
    disabled,
    title,
}: {
    onUp?: () => void
    onDown?: () => void
    disabled?: boolean
    title?: string
}) {
    const { t } = useTranslation()
    return (
        <span className="inline-flex items-center gap-1">
            <Button
                size="sm"
                variant="ghost"
                className="h-3 p-0"
                title={title ?? t("reys_order.move_up")}
                disabled={disabled || !onUp}
                icon={<ArrowUp size={15} />}
                onClick={(e) => {
                    e.stopPropagation()
                    onUp?.()
                }}
            />
            <Button
                size="sm"
                variant="ghost"
                className="h-3 p-0"
                title={title ?? t("reys_order.move_down")}
                disabled={disabled || !onDown}
                icon={<ArrowDown size={15} />}
                onClick={(e) => {
                    e.stopPropagation()
                    onDown?.()
                }}
            />
        </span>
    )
}
