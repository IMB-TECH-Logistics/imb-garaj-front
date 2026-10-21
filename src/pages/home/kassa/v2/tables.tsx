import TableActions from "@/components/custom/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { Check, Download, RotateCcw, X } from "lucide-react"
import { ReactNode, useMemo, useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import {
    errorText,
    KassaRequest,
    KassaTx,
    KIND_DIR,
    KV2_REQUESTS,
    KV2_TRANSACTIONS,
    Paged,
    STATUS,
    useKassaPost,
    useKassaRoles,
    usePeriod,
} from "./api"
import { Money, Party, DateCell, Head, Filter } from "./table-cells"
import { EXCEL_MODAL, ExcelModal } from "./excel-modal"
import { usePaging, paginationProps } from "./table-utils"
import { KassaRow, requestRow, kindFilters, requestKindFilter, mergeCloses } from "./kassa-rows"
import { DETAIL_MODAL, CloseDetailModal } from "./close-detail-modal"
export { CloseLines } from "./table-cells"
export { RequestsTable } from "./requests-table"
export { TripsTable } from "./trips-table"
export { LedgerTable, DriverExpensesTable } from "./ledger-tables"

export const KassaTable = ({ switcher, actions, onEdit, onDelete, onReverse, onReject, onPay, onEditRequest, group, groupLabel, onClearGroup }: {
    group?: string | null
    groupLabel?: string
    onClearGroup?: () => void
    switcher: ReactNode
    actions: ReactNode
    onEdit: (r: KassaTx) => void
    onDelete: (r: KassaTx) => void
    onReverse: (r: KassaTx) => void
    onReject: (r: KassaRequest) => void
    onPay: (r: KassaRequest) => void
    onEditRequest: (r: KassaRequest) => void
}) => {
    const { t } = useTranslation()
    const { cashier } = useKassaRoles()
    const period = usePeriod()
    const [dir, setDir] = useState("all")
    const [kindF, setKindF] = useState("all")
    const params = { ...period, ...usePaging(), dir: group || dir === "all" ? undefined : dir, kind: group || kindF === "all" ? undefined : kindF, group: group || undefined }
    const { data, isLoading } = useGet<Paged<KassaTx>>(KV2_TRANSACTIONS, { params })
    const { data: reqData } = useGet<Paged<KassaRequest>>(KV2_REQUESTS, { params: { status: `${STATUS.PENDING},${STATUS.REJECTED}`, page_size: 1000 } })
    const reqs = useMemo(() => (reqData?.results ?? []).filter((q) => !q.trip && (q.status === STATUS.PENDING || q.can_unreject)), [reqData])
    const pendingCount = reqs.filter((q) => q.status === STATUS.PENDING).length
    const { mutate: post, isPending } = useKassaPost()
    const act = (url: string, ok: string) =>
        post(url, {}, { onSuccess: () => toast.success(ok), onError: (e: unknown) => toast.error(errorText(e)) })
    const rows = useMemo<KassaRow[]>(() => {
        const pend = group ? [] : reqs
            .filter((q) => kindF === "all" || requestKindFilter(q) === kindF)
            .map(requestRow)
            .filter((r) => dir === "all" || r.dir === dir)
        const list = [...pend, ...(data?.results ?? [])]
        if (group) return list.map((r) => ({ ...r, close: null }))
        const merged = mergeCloses(list, t("fin.kv2.close_turnover"))
        return dir === "all" ? merged : merged.filter((r) => r.dir === dir)
    }, [data, reqs, dir, kindF, group, t])
    const excelModal = useModal(EXCEL_MODAL)
    const detailModal = useModal(DETAIL_MODAL)
    const [detail, setDetail] = useState<KassaRow | null>(null)
    const openDetail = (r: KassaRow) => {
        setDetail(r)
        detailModal.openModal()
    }

    const columns = useMemo<ColumnDef<KassaRow>[]>(
        () => [
            {
                header: t("form.date"),
                accessorKey: "created",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <DateCell v={row.original.created} />
                        {row.original.edited_at && <span className="text-xs text-muted-foreground">{t("fin.kv2.edited")}</span>}
                    </div>
                ),
            },
            { header: t("table.user_col"), accessorKey: "executor_name", cell: ({ row }) => <span className="text-muted-foreground">{row.original.executor_name || "—"}</span> },
            { header: t("fin.kv2.col_who"), accessorKey: "party", cell: ({ row }) => <Party name={row.original.party} trip={row.original.trip} /> },
            {
                header: t("fin.kv2.col_why"),
                accessorKey: "kind_label",
                cell: ({ row }) =>
                    (row.original.kind === "chiqim" || row.original.kind === "income") && row.original.comment ?
                        row.original.comment
                    :   row.original.kind_label + (row.original.expense_type ? ` · ${row.original.expense_type}` : ""),
            },
            {
                header: t("fin.kv2.col_total"),
                accessorKey: "amount",
                cell: ({ row }) => {
                    const r = row.original
                    const body = (
                        <>
                            <Money v={r.amount} dir={r.dir} />
                            {r.close && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap underline decoration-dotted underline-offset-2">
                                    {r.dir === "in" ? t("fin.kv2.takes") : t("fin.kv2.gives")}
                                </span>
                            )}
                        </>
                    )
                    if (!r.close) return <div className={cn("flex flex-col", r.reversed && "line-through opacity-60")}>{body}</div>
                    return (
                        <button
                            type="button"
                            title={t("page.details")}
                            onClick={(e) => { e.stopPropagation(); openDetail(r) }}
                            className={cn("flex flex-col items-start text-left rounded-md -mx-1.5 px-1.5 py-0.5 hover:bg-muted/80 cursor-pointer", r.reversed && "line-through opacity-60")}
                        >
                            {body}
                        </button>
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
            data={rows}
            onRowClick={(r: KassaRow) => r.close && openDetail(r)}
            wrapperClassName="md:h-full flex flex-col"
            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
            paginationProps={paginationProps(data?.total_pages)}
            rowAction={(row: KassaRow) => {
                const q = row.req
                if (q && q.status === STATUS.REJECTED) {
                    return (
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                                <Badge variant="destructive" className="w-fit whitespace-nowrap">{t("kassa.status_rejected")}</Badge>
                                <Button size="sm" variant="outline" className="h-8 gap-1" disabled={isPending} onClick={() => act(`${KV2_REQUESTS}/${q.id}/unreject`, t("fin.kv2.unreject_done"))}>
                                    <RotateCcw size={14} />
                                    {t("fin.kv2.return_btn")}
                                </Button>
                            </div>
                            {q.rejected_comment && <span className="text-xs text-muted-foreground max-w-56 text-right">{q.rejected_comment}</span>}
                        </div>
                    )
                }
                if (q) {
                    if (cashier) {
                        const out = KIND_DIR[q.kind] === "out"
                        return (
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1">
                                    <Button size="sm" className="h-8 gap-1" disabled={isPending} onClick={() => (q.close ? openDetail(row) : onPay(q))}>
                                        <Check size={16} />
                                        {out ? t("vst.gave") : t("fin.kv2.received")}
                                    </Button>
                                    <Button size="sm" variant="destructive" className="h-8 gap-1" onClick={() => onReject(q)}>
                                        <X size={16} />
                                        {t("kassa.reject")}
                                    </Button>
                                </div>
                            </div>
                        )
                    }
                    return (
                        <div className="flex items-center gap-2 justify-end">
                            <Badge variant="orange" className="w-fit whitespace-nowrap">{t("status.pending")}</Badge>
                        </div>
                    )
                }
                const r: KassaTx = row
                if (r.reversed)
                    return (
                        <div className="flex flex-col items-end gap-0.5">
                            <Badge variant="secondary" className="w-fit whitespace-nowrap">{t("kassa.status_rollback")}</Badge>
                            <span className="text-xs text-muted-foreground max-w-48 text-right">{r.reversed.reason}</span>
                        </div>
                    )
                if (!cashier) return null
                if (r.can_edit) return <TableActions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} />
                if (r.can_reverse) return <TableActions onUndo={() => onReverse(r)} />
                return null
            }}
            head={
                <Head
                    left={<>{switcher}{group && (
                        <Badge variant="secondary" className="gap-1.5 cursor-pointer" onClick={onClearGroup}>
                            {groupLabel}
                            <X size={12} />
                        </Badge>
                    )}{!!pendingCount && <Badge variant="orange">{t("fin.kv2.pending_n", { count: pendingCount })}</Badge>}</>}
                    right={<>
                        {!group && <>
                            <Filter value={kindF} onChange={setKindF} options={kindFilters(t)} />
                            <Filter value={dir} onChange={setDir} options={[["all", t("fin.kv2.filter_in_out")], ["in", t("fin.kv2.filter_only_in")], ["out", t("fin.kv2.filter_only_out")]]} />
                        </>}
                        <Button onClick={() => excelModal.openModal()}>
                            <Download size={16} />
                            Excel
                        </Button>
                        <ExcelModal />
                        <CloseDetailModal row={detail} onReject={onReject} />
                        {actions}
                    </>}
                />
            }
        />
    )
}
