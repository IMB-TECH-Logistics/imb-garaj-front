import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useVstFinance } from "@/hooks/use-vst-finance"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"
import { ReactNode } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import {
    errorText,
    fmtDate,
    KassaRequest,
    KassaTrip,
    KIND_DIR,
    ClosePreview,
    KV2_REQUESTS,
    KV2_TRIPS,
    money,
    n,
    STATUS,
    useKassaPost,
    useKassaRoles,
} from "./api"
import { Money, Part } from "./table-cells"
import PayDateField, { usePayDate } from "@/pages/home/managers/managers-trips/pay-date-field"
import { KassaRow, tripPeriod } from "./kassa-rows"

export const DETAIL_MODAL = "kassa-v2-close-detail"

const DetailRow = ({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) => (
    <div className={cn("flex items-center justify-between gap-3 py-2 text-sm", className)}>
        <span>{label}</span>
        {children}
    </div>
)

type ExpenseLine = { id: number; amount: number | string; category_name: string | null; station?: string | null; payment_type?: string | null; route?: string | null; comment: string | null; date: string }

const ExpenseGroup = ({ title, note, rows }: { title: string; note?: string; rows: ExpenseLine[] }) => {
    const total = rows.reduce((a, e) => a + Math.abs(n(e.amount)), 0)
    return (
        <div className="flex items-baseline justify-between gap-2 px-3 py-2 border-b bg-muted/50">
            <span className="text-sm font-medium">{title}{note && <span className="ml-1 text-xs font-normal text-muted-foreground">· {note}</span>}</span>
            <span className="text-sm font-medium tabular-nums whitespace-nowrap">{rows.length ? money(total) : "—"}</span>
        </div>
    )
}

const TripExpenses = ({ trip, modalKey = DETAIL_MODAL, legacyNote = false }: { trip: number; modalKey?: string; legacyNote?: boolean }) => {
    const { t } = useTranslation()
    const { isOpen } = useModal(modalKey)
    const { data, isLoading } = useGet<ClosePreview>(`${KV2_TRIPS}/${trip}/close-preview`, { enabled: isOpen, options: { staleTime: 0 } })
    if (isLoading || !data) return <p className="text-sm text-muted-foreground">{t("messages.loading")}</p>
    const other = data.other_expenses ?? []
    const total = n(data.spent) + n(data.other_spent)
    return (
        <div className="rounded-lg border overflow-hidden">
            <ExpenseGroup title={t("fin.kv2.expenses_cash")} rows={data.expenses} />
            <ExpenseGroup title={t("fin.kv2.other_expenses")} note={legacyNote ? t("fin.kv2.other_expenses_note") : undefined} rows={other} />
            <div className="flex items-center justify-between gap-3 px-3 py-2 font-semibold text-sm">
                <span>{t("fin.kv2.total_expenses")}</span>
                <span className="tabular-nums whitespace-nowrap">{money(total)} {t("page.som")}</span>
            </div>
        </div>
    )
}

const ExpenseList = ({ title, rows, tone }: { title: string; rows: ExpenseLine[]; tone: "cash" | "other" }) => {
    const { t } = useTranslation()
    const total = rows.reduce((a, e) => a + Math.abs(n(e.amount)), 0)
    return (
        <section className="rounded-xl border overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/40 border-b">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", tone === "cash" ? "bg-primary" : "bg-amber-500")} />
                    <span className="font-medium">{title}</span>
                    <span className="text-xs text-muted-foreground">{rows.length}</span>
                </div>
                <span className="font-semibold tabular-nums whitespace-nowrap">{rows.length ? `${money(total)} ${t("page.som")}` : "—"}</span>
            </header>
            {rows.length ?
                <ul className="divide-y max-h-64 overflow-y-auto">
                    {rows.map((e) => {
                        const extra = [e.station, e.payment_type, e.route].filter(Boolean).join(" · ")
                        return (
                            <li key={e.id} className="flex items-start justify-between gap-4 px-4 py-2.5">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate">{e.category_name || t("fin.kv2.expense_other")}</span>
                                    <span className="text-xs text-muted-foreground truncate">
                                        {fmtDate(e.date)}
                                        {extra ? ` · ${extra}` : ""}
                                        {e.comment ? ` · ${e.comment}` : ""}
                                    </span>
                                </div>
                                <span className="text-sm tabular-nums whitespace-nowrap">{money(Math.abs(n(e.amount)))}</span>
                            </li>
                        )
                    })}
                </ul>
            :   <p className="px-4 py-4 text-sm text-muted-foreground">{t("fin.kv2.no_expenses")}</p>}
        </section>
    )
}

const TripExpensesBody = ({ trip }: { trip: KassaTrip }) => {
    const { t } = useTranslation()
    const { isOpen } = useModal(TRIP_EXP_MODAL)
    const { data, isLoading } = useGet<ClosePreview>(`${KV2_TRIPS}/${trip.id}/close-preview`, { enabled: isOpen, options: { staleTime: 0 } })
    const info = [
        [t("table.driver"), trip.driver_name || "—"],
        [t("table.vehicle"), trip.plate || "—"],
        [t("fin.kv2.turnover_period"), tripPeriod(trip.start, trip.end, t("fin.kv2.ongoing"))],
    ]
    const total = data ? n(data.spent) + n(data.other_spent) : 0
    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {info.map(([label, value]) => (
                    <div key={label} className="rounded-xl border bg-muted/20 px-4 py-3 flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="font-semibold tabular-nums break-words" title={value}>{value}</span>
                    </div>
                ))}
            </div>
            {isLoading || !data ?
                <p className="text-sm text-muted-foreground">{t("messages.loading")}</p>
            :   <>
                    <ExpenseList title={t("fin.kv2.expenses_cash")} rows={data.expenses} tone="cash" />
                    <ExpenseList title={t("fin.kv2.other_expenses")} rows={data.other_expenses ?? []} tone="other" />
                    <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 flex items-center justify-between gap-3">
                        <span className="font-semibold">{t("fin.kv2.total_expenses")}</span>
                        <span className="text-lg font-bold tabular-nums whitespace-nowrap text-destructive">{money(total)} {t("page.som")}</span>
                    </div>
                </>
            }
        </div>
    )
}

export const TRIP_EXP_MODAL = "kassa-v2-trip-expenses"

export const TripExpensesModal = ({ trip }: { trip: KassaTrip | null }) => {
    const { t } = useTranslation()
    const vst = useVstFinance()
    return (
        <Modal modalKey={TRIP_EXP_MODAL} title={trip ? t("fin.kv2.trip_expenses_title", { id: trip.id }) : ""} size={vst ? "max-w-2xl" : "max-w-md"}>
            {trip &&
                (vst ?
                    <TripExpensesBody trip={trip} />
                :   <div className="flex flex-col gap-3">
                        <p className="text-sm text-muted-foreground">
                            {[trip.driver_name, trip.plate, tripPeriod(trip.start, trip.end, t("fin.kv2.ongoing"))].filter(Boolean).join(" · ")}
                        </p>
                        <TripExpenses trip={trip.id} modalKey={TRIP_EXP_MODAL} legacyNote />
                    </div>)}
        </Modal>
    )
}

export const CloseDetailModal = ({ row, onReject }: { row: KassaRow | null; onReject: (r: KassaRequest) => void }) => {
    const { t } = useTranslation()
    const c = row?.close
    const req = row?.req
    const q = req && req.status === STATUS.PENDING ? req : undefined
    const { cashier } = useKassaRoles()
    const { closeModal } = useModal(DETAIL_MODAL)
    const { mutate: post, isPending } = useKassaPost(closeModal)
    const out = !!q && KIND_DIR[q.kind] === "out"
    const [payDate, setPayDate] = usePayDate(q?.trip_end ?? c?.trip_end, q?.id)
    return (
        <Modal modalKey={DETAIL_MODAL} title={row?.trip ? t("fin.kv2.close_detail_title", { id: row.trip }) : t("fin.kv2.close_detail_title_plain")} size="max-w-md">
            {c && row && (
                <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">{row.party || "—"}</p>
                    <div className="rounded-lg border px-3 divide-y">
                        <DetailRow label={t("fin.kv2.turnover_period")}><span className="tabular-nums whitespace-nowrap">{tripPeriod(c.trip_start, c.trip_end, t("fin.kv2.ongoing"))}</span></DetailRow>
                        <DetailRow label={t("fin.kv2.given_advance")}><Part v={c.given} sign="−" /></DetailRow>
                        <DetailRow label={t("fin.kv2_kind.avans_qaytarish")}><Part v={c.avans_left} sign="+" /></DetailRow>
                        <DetailRow label={t("fin.kv2.trip_cash")}><Part v={c.earned} sign="+" /></DetailRow>
                        <DetailRow label={t("table.monthly_salary")}><Part v={c.salary} sign="−" /></DetailRow>
                        <DetailRow label={row.dir === "in" ? t("fin.kv2.takes_cap") : t("fin.kv2.gives_cap")} className="font-semibold">
                            <Money v={row.amount} dir={row.dir} />
                        </DetailRow>
                    </div>
                    {q && cashier && (
                        <div className="flex flex-col gap-3">
                            <PayDateField value={payDate} onChange={setPayDate} />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="destructive"
                                    className="gap-1"
                                    disabled={isPending}
                                    onClick={() => { closeModal(); onReject(q) }}
                                >
                                    <X size={16} />
                                    {t("kassa.reject")}
                                </Button>
                                <Button
                                    className="min-w-32 gap-1"
                                    loading={isPending}
                                    onClick={() => post(`${KV2_REQUESTS}/${q.id}/pay`, payDate ? { date: payDate } : {}, {
                                        onSuccess: () => toast.success(out ? t("fin.kv2.toast_close_paid_out") : t("fin.kv2.toast_close_paid_in")),
                                        onError: (e: unknown) => toast.error(errorText(e)),
                                    })}
                                >
                                    <Check size={16} />
                                    {out ? t("vst.gave") : t("fin.kv2.received")}
                                </Button>
                            </div>
                        </div>
                    )}
                    {q && !cashier && <Badge variant="orange" className="w-fit self-end">{t("fin.kv2.awaiting_cashier")}</Badge>}
                    {req && req.status === STATUS.PAID && (
                        <span className="text-xs text-muted-foreground text-right">
                            {t("kassa.status_approved")}{req.paid_by_name ? ` · ${req.paid_by_name}` : ""}{req.paid_at ? ` · ${fmtDate(req.paid_at)}` : ""}
                        </span>
                    )}
                    {req && req.status === STATUS.REJECTED && (
                        <span className="text-xs text-destructive text-right">{t("vst.st_rejected")}{req.rejected_comment ? `: ${req.rejected_comment}` : ""}</span>
                    )}
                </div>
            )}
        </Modal>
    )
}
