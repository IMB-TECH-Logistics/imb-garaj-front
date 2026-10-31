import TableActions from "@/components/custom/table-actions"
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/format-money"
import { useVstFinance } from "@/hooks/use-vst-finance"
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
    KassaTrip,
    KV2_REQUESTS,
    KV2_TRANSACTIONS,
    KV2_TRIPS,
    VEHICLES_LIST,
    looseRequests,
    Paged,
    n,
    STATUS,
    useKassaPost,
    useKassaRoles,
    useOverview,
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
    const [vehicle, setVehicle] = useState<number | null>(null)
    const byVehicle = group === "out_garaj"
    const { data: vehiclesData } = useGet<{ results?: { id: number; truck_number: string }[] } | { id: number; truck_number: string }[]>(VEHICLES_LIST, {
        params: { page_size: 500 },
        enabled: byVehicle,
    })
    const vehicleList = Array.isArray(vehiclesData) ? vehiclesData : vehiclesData?.results ?? []
    const params = {
        ...period,
        ...usePaging(),
        dir: group || dir === "all" ? undefined : dir,
        kind: group || kindF === "all" ? undefined : kindF,
        group: group && group !== "all" ? group : undefined,
        vehicle: byVehicle && vehicle ? vehicle : undefined,
    }
    const { data, isLoading } = useGet<Paged<KassaTx>>(KV2_TRANSACTIONS, { params })
    const { data: overview } = useOverview()
    const { data: allPeriod } = useGet<Paged<KassaTx>>(KV2_TRANSACTIONS, { params: { ...period, page_size: 1000 } })
    const vst = useVstFinance()
    const balances = useMemo(() => {
        const byTx = new Map<number, number>()
        const byClose = new Map<number, number>()
        let balance = n(overview?.summary?.opening)
        ;[...(allPeriod?.results ?? [])]
            .sort((a, b) => a.created.localeCompare(b.created) || a.id - b.id)
            .forEach((tx) => {
                balance += tx.dir === "in" ? n(tx.amount) : -n(tx.amount)
                byTx.set(tx.id, balance)
                if (tx.close) byClose.set(tx.close.id, balance)
            })
        return { byTx, byClose }
    }, [allPeriod, overview])
    const { data: reqData } = useGet<Paged<KassaRequest>>(KV2_REQUESTS, { params: { status: `${STATUS.PENDING},${STATUS.REJECTED}`, page_size: 1000 } })
    const { data: tripsData } = useGet<KassaTrip[]>(KV2_TRIPS, { params: period })
    const reqs = useMemo(() => looseRequests(reqData?.results, tripsData), [reqData, tripsData])
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
            ...(vst ?
                ([
                {
                    header: t("fin.kv2.opening_ledger_balance"),
                    id: "balance",
                    cell: ({ row }) => {
                        const r = row.original
                        const v = r.req ? undefined : r.close ? balances.byClose.get(r.close.id) : balances.byTx.get(r.id)
                        if (v === undefined) return <span className="text-muted-foreground">—</span>
                        return <span className={cn("tabular-nums font-semibold whitespace-nowrap", v < 0 && "text-destructive")}>{formatMoney(v)}</span>
                    },
                },
                ] as ColumnDef<KassaRow>[])
            :   []),
        ],
        [t, balances, vst],
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
                        {byVehicle && (
                            <Combobox
                                label={t("table.vehicle")}
                                options={vehicleList.map((v) => ({ id: v.id, name: v.truck_number }))}
                                value={vehicle}
                                setValue={(v: any) => setVehicle(v ? Number(v) : null)}
                                labelKey="name"
                                valueKey="id"
                                className="h-10 w-44"
                            />
                        )}
                        {group && data?.totals && (
                            <span className="text-sm whitespace-nowrap">
                                {t("fin.kv2.col_total")}: <b className="tabular-nums">{formatMoney(n(data.totals.net))} {t("page.som")}</b>
                            </span>
                        )}
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
