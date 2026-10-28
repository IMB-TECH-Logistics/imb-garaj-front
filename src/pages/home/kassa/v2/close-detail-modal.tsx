import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
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

const TripExpenses = ({ trip, modalKey = DETAIL_MODAL }: { trip: number; modalKey?: string }) => {
    const { t } = useTranslation()
    const { isOpen } = useModal(modalKey)
    const { data, isLoading } = useGet<ClosePreview>(`${KV2_TRIPS}/${trip}/close-preview`, { enabled: isOpen, options: { staleTime: 0 } })
    if (isLoading || !data) return <p className="text-sm text-muted-foreground">{t("messages.loading")}</p>
    const other = data.other_expenses ?? []
    const total = n(data.spent) + n(data.other_spent)
    return (
        <div className="rounded-lg border overflow-hidden">
            <ExpenseGroup title={t("fin.kv2.expenses_cash")} rows={data.expenses} />
            <ExpenseGroup title={t("fin.kv2.other_expenses")} rows={other} />
            <div className="flex items-center justify-between gap-3 px-3 py-2 font-semibold text-sm">
                <span>{t("fin.kv2.total_expenses")}</span>
                <span className="tabular-nums whitespace-nowrap">{money(total)} {t("page.som")}</span>
            </div>
        </div>
    )
}

export const TRIP_EXP_MODAL = "kassa-v2-trip-expenses"

export const TripExpensesModal = ({ trip }: { trip: KassaTrip | null }) => {
    const { t } = useTranslation()
    return (
        <Modal modalKey={TRIP_EXP_MODAL} title={trip ? t("fin.kv2.trip_expenses_title", { id: trip.id }) : ""} size="max-w-md">
            {trip && (
                <div className="flex flex-col gap-3">
                    <div className="rounded-lg border px-3 divide-y">
                        <DetailRow label={t("table.driver")}><span className="font-medium">{trip.driver_name || "—"}</span></DetailRow>
                        <DetailRow label={t("table.vehicle")}><span className="font-medium">{trip.plate || "—"}</span></DetailRow>
                        <DetailRow label={t("fin.kv2.turnover_period")}><span className="tabular-nums whitespace-nowrap">{tripPeriod(trip.start, trip.end, t("fin.kv2.ongoing"))}</span></DetailRow>
                    </div>
                    <TripExpenses trip={trip.id} modalKey={TRIP_EXP_MODAL} />
                </div>
            )}
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
