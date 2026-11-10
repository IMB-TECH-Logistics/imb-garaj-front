import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MANAGERS_CASHFLOW_TRIP_STAT } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatDateTime } from "@/lib/format-date"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

export type CloseBalance = { closed_at: string; at_close: number; now: number; diff: number }

type Change = {
    id: number
    kind: "added" | "edited" | "deleted"
    when: string
    action: number
    category: string | null
    amount: number | null
    comment: string | null
    user: string | null
    changes: { label: string; old: string | null; new: string | null }[]
}

const MODAL_KEY = "trip-close-balance-changes"

export function DiffText({ diff }: { diff: number }) {
    if (!diff) return <span className="text-muted-foreground">0</span>
    return (
        <span className={cn("font-medium whitespace-nowrap", diff > 0 ? "text-green-600" : "text-red-500")}>
            {diff > 0 ? "+" : "−"}
            {formatMoney(Math.abs(diff))}
        </span>
    )
}

export function CloseBalanceStrip({ tripId }: { tripId?: number }) {
    const { t } = useTranslation()
    const { openModal } = useModal(MODAL_KEY)
    const { data } = useGet<{ balance: CloseBalance | null; changes: Change[] }>(
        `${MANAGERS_CASHFLOW_TRIP_STAT}/${tripId}/close-balance`,
        { enabled: !!tripId },
    )
    const b = data?.balance
    if (!b) return null
    const changed = Number(b.diff) !== 0 || (data?.changes.length ?? 0) > 0
    return (
        <>
            <div
                className={cn(
                    "flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border px-4 py-2 text-sm",
                    changed ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30" : "bg-muted/30",
                )}
            >
                <span className="flex items-center gap-1.5 font-medium">
                    {changed && <AlertTriangle size={16} className="text-amber-600" />}
                    {t("trips.close_balance.title")}
                </span>
                <span>
                    <span className="text-muted-foreground">{t("trips.close_balance.at_close", { date: formatDateTime(b.closed_at) })}: </span>
                    <span className="font-medium">{formatMoney(Number(b.at_close))}</span>
                </span>
                <span>
                    <span className="text-muted-foreground">{t("trips.close_balance.now")}: </span>
                    <span className="font-medium">{formatMoney(Number(b.now))}</span>
                </span>
                <span>
                    <span className="text-muted-foreground">{t("trips.close_balance.diff")}: </span>
                    <DiffText diff={Number(b.diff)} />
                </span>
                {(data?.changes.length ?? 0) > 0 && (
                    <Button size="sm" variant="outline" className="ml-auto h-7" onClick={() => openModal()}>
                        {t("trips.close_balance.changes", { count: data!.changes.length })}
                    </Button>
                )}
            </div>
            <Modal modalKey={MODAL_KEY} title={t("trips.close_balance.changes_title")} size="max-w-3xl">
                <div className="flex flex-col divide-y max-h-[70vh] overflow-y-auto">
                    {data?.changes.map((c) => (
                        <div key={`${c.kind}-${c.id}-${c.when}`} className="flex flex-col gap-1 py-2 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={(c.kind === "deleted" ? "destructive" : c.kind === "added" ? "default" : "orange") as any}>
                                    {t(`trips.close_balance.kind_${c.kind}`)}
                                </Badge>
                                <span className="font-medium">{c.category || "—"}</span>
                                {c.amount != null && <span>{formatMoney(Number(c.amount))}</span>}
                                <span className="ml-auto text-muted-foreground whitespace-nowrap">
                                    {formatDateTime(c.when)}
                                    {c.user ? ` · ${c.user}` : ""}
                                </span>
                            </div>
                            {c.changes.map((ch, i) => (
                                <div key={i} className="pl-2 text-muted-foreground">
                                    {ch.label}: {ch.old ?? "—"} → {ch.new ?? "—"}
                                </div>
                            ))}
                            {c.comment && <div className="pl-2 text-muted-foreground">{c.comment}</div>}
                        </div>
                    ))}
                </div>
            </Modal>
        </>
    )
}
