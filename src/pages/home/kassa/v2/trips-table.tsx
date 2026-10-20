import TableActions from "@/components/custom/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { Check, RotateCcw, X } from "lucide-react"
import { ReactNode, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import {
    errorText,
    KassaRequest,
    KassaTrip,
    KassaTx,
    KV2_REQUESTS,
    KV2_TRIPS,
    money,
    n,
    STATUS,
    TripStatus,
    useKassaPost,
    useKassaRoles,
    usePeriod,
} from "./api"
import { Money, Head, Part } from "./table-cells"
import { KassaRow, requestRow, tripPeriod } from "./kassa-rows"
import { DETAIL_MODAL, TRIP_EXP_MODAL, TripExpensesModal, CloseDetailModal } from "./close-detail-modal"

const TRIP_STATUS: Record<TripStatus, [string, "orange" | "default" | "secondary" | "destructive"]> = {
    avans_kutilmoqda: ["fin.kv2.trip_st_advance_pending", "orange"],
    avans_rad_etildi: ["fin.kv2.trip_st_advance_rejected", "destructive"],
    yolda: ["status.on_road", "default"],
    yopilmoqda: ["fin.kv2.trip_st_closing_pending", "orange"],
    rad_etildi: ["fin.kv2.trip_st_closing_rejected", "destructive"],
    yopildi: ["fin.kv2.trip_st_closed", "secondary"],
}

// Tor ekranda (<1024px) 270px li amallar ustuni yopishqoq bo'lsa ma'lumot ustunlarini butunlay yopadi (U6-01).
function useMinWidth(px: number) {
    const query = `(min-width: ${px}px)`
    const [ok, setOk] = useState(() => typeof window === "undefined" || window.matchMedia(query).matches)
    useEffect(() => {
        const m = window.matchMedia(query)
        const onChange = () => setOk(m.matches)
        onChange()
        m.addEventListener("change", onChange)
        return () => m.removeEventListener("change", onChange)
    }, [query])
    return ok
}

export const TripsTable = ({ switcher, onPay, onReject, onReverse, actions }: {
    switcher: ReactNode
    onPay: (r: KassaRequest) => void
    onReject: (r: KassaRequest) => void
    onReverse: (r: KassaTx) => void
    actions?: ReactNode
}) => {
    const { t } = useTranslation()
    const { cashier } = useKassaRoles()
    const wideTable = useMinWidth(1024)
    const period = usePeriod()
    const { data, isLoading } = useGet<KassaTrip[]>(KV2_TRIPS, { params: period })
    const trips = useMemo(
        () => (data ?? []).slice().sort((a, b) => (a.status === "yopildi" ? 1 : 0) - (b.status === "yopildi" ? 1 : 0)),
        [data],
    )
    const { mutate: postReq, isPending: posting } = useKassaPost()
    const unreject = (q: KassaRequest) =>
        postReq(`${KV2_REQUESTS}/${q.id}/unreject`, {}, {
            onSuccess: () => toast.success(t("fin.kv2.unreject_done")),
            onError: (e: unknown) => toast.error(errorText(e)),
        })
    const undoBtn = (q: KassaRequest) => (
        <Button size="sm" variant="outline" className="h-8 gap-1" disabled={posting} onClick={() => unreject(q)}>
            <RotateCcw size={14} />
            {t("fin.kv2.undo_reject")}
        </Button>
    )
    const detailModal = useModal(DETAIL_MODAL)
    const [detail, setDetail] = useState<KassaRow | null>(null)
    const expModal = useModal(TRIP_EXP_MODAL)
    const [expTrip, setExpTrip] = useState<KassaTrip | null>(null)
    const openDetail = (tr: KassaTrip) => {
        if (!tr.close_request) {
            setExpTrip(tr)
            expModal.openModal()
            return
        }
        setDetail(requestRow(tr.close_request))
        detailModal.openModal()
    }
    const columns = useMemo<ColumnDef<KassaTrip>[]>(
        () => [
            {
                header: t("fin.kv2.turnover_period"),
                id: "period",
                cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{tripPeriod(row.original.start, row.original.end, t("fin.kv2.ongoing"))}</span>,
            },
            {
                header: t("fin.kv2.col_vehicle_driver"),
                accessorKey: "plate",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="whitespace-nowrap tabular-nums">{row.original.plate || "—"}</span>
                        <span className="text-xs text-muted-foreground block truncate max-w-48" title={row.original.driver_name || undefined}>{row.original.driver_name || "—"}</span>
                    </div>
                ),
            },
            {
                header: t("fin.kv2.given_advance"),
                id: "given",
                cell: ({ row }) => {
                    const tr = row.original
                    return (
                        <div className="flex flex-col">
                            <Part v={tr.given} sign="−" />
                            {tr.avans_request && (
                                <span className={cn("text-xs whitespace-nowrap", tr.avans_request.status === STATUS.REJECTED ? "text-destructive" : "text-orange-500")}>
                                    {tr.avans_request.status === STATUS.REJECTED ? t("fin.kv2.advance_rejected_lbl") : t("fin.kv2.advance_requested_lbl")}: {money(tr.avans_request.amount)}
                                </span>
                            )}
                        </div>
                    )
                },
            },
            {
                header: t("table.status"),
                id: "status",
                cell: ({ row }) => {
                    const tr = row.original
                    const [label, variant] = TRIP_STATUS[tr.status]
                    return (
                        <div className="flex flex-col gap-0.5">
                            <Badge variant={variant} className="w-fit whitespace-nowrap">{t(label)}</Badge>
                            {tr.status === "rad_etildi" && tr.close_request?.rejected_comment && (
                                <span className="text-xs text-muted-foreground max-w-48">{tr.close_request.rejected_comment}</span>
                            )}
                            {tr.status === "avans_rad_etildi" && tr.avans_request?.rejected_comment && (
                                <span className="text-xs text-muted-foreground max-w-48">{tr.avans_request.rejected_comment}</span>
                            )}
                        </div>
                    )
                },
            },
            {
                header: t("fin.kv2.col_total"),
                id: "net",
                cell: ({ row }) => {
                    const q = row.original.close_request
                    const salary = n(row.original.salary_paid)
                    if (!q && row.original.status === "yopildi") {
                        const carried = n(row.original.carried)
                        return (
                            <div className="flex flex-col">
                                {carried ?
                                    <Money v={Math.abs(carried)} dir={carried > 0 ? "in" : "out"} />
                                :   <span className="font-semibold tabular-nums whitespace-nowrap">{formatMoney(Math.abs(n(row.original.close_amount)))}</span>}
                                {!!carried && (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {carried > 0 ? t("fin.kv2.takes") : t("fin.kv2.gives")} · {t("fin.kv2.carried_next")}
                                    </span>
                                )}
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {salary ? t("fin.kv2.settled_salary_only", { amount: money(salary) }) : carried ? "" : t("fin.kv2.settled_zero")}
                                </span>
                            </div>
                        )
                    }
                    if (!q) return <span className="text-muted-foreground">—</span>
                    const r = requestRow(q)
                    return (
                        <div className="flex flex-col">
                            <Money v={r.amount} dir={r.dir} />
                            <span className="text-xs text-muted-foreground whitespace-nowrap underline decoration-dotted underline-offset-2">
                                {r.dir === "in" ? t("fin.kv2.takes") : t("fin.kv2.gives")}
                            </span>
                        </div>
                    )
                },
            },
        ],
        [t],
    )
    return (
        <DataTable
            numeration
            loading={isLoading}
            columns={columns}
            data={trips}
            onRowClick={(tr: KassaTrip) => openDetail(tr)}
            stickyActions={wideTable}
            wrapperClassName="md:h-full flex flex-col"
            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
            rowAction={(tr: KassaTrip) => {
                const av = tr.avans_request
                if (av && av.status === STATUS.REJECTED) return av.can_unreject ? undoBtn(av) : null
                if (tr.status === "rad_etildi" && tr.close_request?.can_unreject) return undoBtn(tr.close_request)
                if (av && cashier) {
                    return (
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                                <Button size="sm" className="h-8 gap-1" onClick={() => onPay(av)}>
                                    <Check size={16} />
                                    {t("fin.kv2.give_advance_btn")}
                                </Button>
                                <Button size="sm" variant="destructive" className="h-8 gap-1" onClick={() => onReject(av)}>
                                    <X size={16} />
                                    {t("kassa.reject")}
                                </Button>
                            </div>
                        </div>
                    )
                }
                if (tr.status === "yopildi") {
                    const q = tr.close_request
                    return q?.reverse_tx ? <TableActions onUndo={() => onReverse({ ...requestRow(q), id: q.reverse_tx as number })} /> : null
                }
                const ready = tr.status === "yopilmoqda"
                return (
                    <Button
                        size="sm"
                        variant={ready ? "default" : "outline"}
                        className="h-8"
                        disabled={!ready || !cashier}
                        title={ready ? t("fin.kv2.title_view_confirm") : tr.status === "rad_etildi" ? t("fin.kv2.title_operator_fix") : t("fin.kv2.title_manager_unfinished")}
                        onClick={() => openDetail(tr)}
                    >
                        {t("fin.kv2.close_btn")}
                    </Button>
                )
            }}
            head={
                <Head
                    left={switcher}
                    right={<>
                        <CloseDetailModal row={detail} onReject={onReject} />
                        <TripExpensesModal trip={expTrip} />
                        {actions}
                    </>}
                />
            }
        />
    )
}
