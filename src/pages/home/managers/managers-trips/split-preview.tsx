import { useGet } from "@/hooks/useGet"
import { money } from "@/pages/home/kassa/v2/api"
import { addDays, format, parseISO } from "date-fns"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import MoveItemButton, { MoveKind } from "./move-item-button"

type Part = {
    start: string | null
    end: string | null
    orders: { id: number; date: string | null; route: string | null; salary: number | string }[]
    expenses: { id: number; date: string | null; category: string | null; amount: number | string; comment: string | null }[]
    advances: { id: number; date: string | null; amount: number | string; comment: string | null }[]
    requests: { id: number; kind: string; amount: number | string; status: number | string }[]
    totals: { salary: number | string; expenses: number | string; advances: number | string }
}

export type SplitPreviewData = { date: string; keep: Part; move: Part }

const fmt = (iso: string | null | undefined) => (iso ? format(parseISO(iso.slice(0, 10)), "dd/MM/yyyy") : "")

export const splitErrorText = (e: any): string | null => {
    const d = e?.response?.data
    if (!d) return null
    const v = d.date ?? d.detail
    return Array.isArray(v) ? String(v[0]) : v ? String(v) : null
}

const PartView = ({ title, part, tripId }: { title: string; part: Part; tripId?: number }) => {
    const { t } = useTranslation()
    const empty = !part.orders.length && !part.expenses.length && !part.advances.length && !part.requests.length
    const item = (key: string, left: string, right: string, kind: MoveKind, id: number) => (
        <div key={key} className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-muted-foreground">{left}</span>
            <span className="flex items-center gap-2 tabular-nums whitespace-nowrap">
                {right}
                <MoveItemButton tripId={tripId} kind={kind} id={id} />
            </span>
        </div>
    )
    const group = (label: string, rows: ReactNode[], total?: number | string) =>
        rows.length > 0 && (
            <div className="space-y-0.5">
                <div className="flex items-center justify-between text-sm font-medium">
                    <span>{label} ({rows.length})</span>
                    {total != null && <span className="tabular-nums">{money(total)}</span>}
                </div>
                {rows}
            </div>
        )
    return (
        <div className="rounded-lg border bg-muted/20 p-3 space-y-2 min-w-0">
            <div className="text-sm font-semibold">{title}</div>
            {empty && <p className="text-xs text-muted-foreground">{t("trips.kclose.split_empty")}</p>}
            {group(t("trips.kclose.trip"), part.orders.map((o) => item(`o${o.id}`, `${fmt(o.date)} ${o.route ?? ""}`.trim(), money(o.salary), "order", o.id)), part.totals.salary)}
            {group(t("trips.kclose.cash_expenses"), part.expenses.map((e) => item(`e${e.id}`, `${fmt(e.date)} ${e.category ?? ""}`.trim(), money(e.amount), "cashflow", e.id)), part.totals.expenses)}
            {group(t("trips.kclose.advance"), part.advances.map((a) => item(`a${a.id}`, `${fmt(a.date)} ${a.comment ?? ""}`.trim(), money(a.amount), "cashflow", a.id)), part.totals.advances)}
            {group(t("trips.kclose.split_requests"), part.requests.map((r) => item(`r${r.id}`, r.kind, money(r.amount), "request", r.id)))}
        </div>
    )
}

export default function SplitPreview({ tripId, date }: { tripId?: number; date: string }) {
    const { t } = useTranslation()
    const { data, isLoading, error } = useGet<SplitPreviewData>(`checkout/kassa-v2/trips/${tripId}/split-preview`, {
        params: { date },
        enabled: !!tripId,
        options: { staleTime: 0, gcTime: 0, retry: false },
    })
    if (isLoading) return <p className="text-sm text-muted-foreground">{t("trips.kclose.loading")}</p>
    if (error) return <p className="text-sm text-destructive">{splitErrorText(error) ?? t("trips.row.error")}</p>
    if (!data) return null
    const next = format(addDays(parseISO(date), 1), "dd/MM/yyyy")
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <PartView title={t("trips.kclose.split_keep", { from: fmt(data.keep.start), to: fmt(date) })} part={data.keep} tripId={tripId} />
            <PartView title={t("trips.kclose.split_move", { from: next })} part={data.move} tripId={tripId} />
        </div>
    )
}
