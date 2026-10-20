import TableActions from "@/components/custom/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { useGet } from "@/hooks/useGet"
import { ColumnDef } from "@tanstack/react-table"
import { Check, Pencil, X } from "lucide-react"
import { ReactNode, useMemo, useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { errorText, fmtDate, KassaRequest, KIND_DIR, KV2_REQUESTS, money, n, Paged, STATUS, useKassaPost, useKassaRoles } from "./api"
import { Money, Party, Note, CloseLines, DateCell, Head, Filter } from "./table-cells"
import { usePaging, paginationProps } from "./table-utils"
import { requestWho } from "./kassa-rows"

const REQ_STATUS: Record<number, [string, "orange" | "default" | "destructive" | "secondary"]> = {
    [STATUS.PENDING]: ["status.pending", "orange"],
    [STATUS.PAID]: ["fin.kv2.st_approved", "default"],
    [STATUS.REJECTED]: ["vst.st_rejected", "destructive"],
    [STATUS.CANCELED]: ["vst.st_canceled", "secondary"],
}

export const RequestsTable = ({ switcher, onReject, onPay, onEdit, actions }: {
    switcher: ReactNode
    onReject: (r: KassaRequest) => void
    onPay: (r: KassaRequest) => void
    onEdit: (r: KassaRequest) => void
    actions?: ReactNode
}) => {
    const { t } = useTranslation()
    const { cashier, operator } = useKassaRoles()
    const [status, setStatus] = useState("all")
    const params = { ...usePaging(), status: status === "all" ? undefined : status }
    const { data, isLoading } = useGet<Paged<KassaRequest>>(KV2_REQUESTS, { params })
    const { mutate: post, isPending } = useKassaPost()

    const act = (url: string, ok: string) =>
        post(url, {}, { onSuccess: () => toast.success(ok), onError: (e: unknown) => toast.error(errorText(e)) })

    const rows = useMemo(
        () => (data?.results ?? []).slice().sort((a, b) => (a.status === STATUS.PENDING ? 0 : 1) - (b.status === STATUS.PENDING ? 0 : 1)),
        [data],
    )

    const columns = useMemo<ColumnDef<KassaRequest>[]>(
        () => [
            { header: t("form.amount"), accessorKey: "amount", cell: ({ row }) => <Money v={row.original.amount} dir={KIND_DIR[row.original.kind]} /> },
            {
                header: t("fin.kv2.col_kind"),
                accessorKey: "kind_label",
                cell: ({ row }) => row.original.close ? t("fin.kv2.close_turnover") : row.original.kind_label + (row.original.expense_type_label ? ` · ${row.original.expense_type_label}` : ""),
            },
            { header: t("fin.kv2.col_to_what"), id: "who", cell: ({ row }) => <Party name={requestWho(row.original)} trip={row.original.trip} /> },
            {
                header: t("form.comment"),
                accessorKey: "comment",
                cell: ({ row }) => row.original.close ? <CloseLines c={row.original.close} /> : (
                    <div className="flex flex-col">
                        <Note v={row.original.comment} />
                        {row.original.expected_amount != null && n(row.original.expected_amount) !== n(row.original.amount) && (
                            <span className="text-xs text-orange-500 whitespace-nowrap">
                                {t("fin.kv2.expected_note", { amount: money(row.original.expected_amount) })}
                            </span>
                        )}
                    </div>
                ),
            },
            { header: t("vst.creator"), accessorKey: "creator_name", cell: ({ row }) => <span className="text-muted-foreground">{row.original.creator_name || "—"}</span> },
            { header: t("form.date"), accessorKey: "created", cell: ({ row }) => <DateCell v={row.original.created} /> },
        ],
        [t],
    )

    return (
        <DataTable
            numeration
            loading={isLoading}
            columns={columns}
            data={rows}
            wrapperClassName="md:h-full flex flex-col"
            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
            paginationProps={paginationProps(data?.total_pages)}
            rowAction={(r: KassaRequest) => {
                if (r.status === STATUS.PENDING && cashier) {
                    const out = KIND_DIR[r.kind] === "out"
                    return (
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                                <Button size="sm" className="h-8 gap-1" disabled={isPending} onClick={() => onPay(r)}>
                                    <Check size={16} />
                                    {out ? t("vst.gave") : t("fin.kv2.received")}
                                </Button>
                                <Button size="sm" variant="destructive" className="h-8 gap-1" onClick={() => onReject(r)}>
                                    <X size={16} />
                                    {t("kassa.reject")}
                                </Button>
                                {operator && <TableActions onEdit={r.close ? undefined : () => onEdit(r)} onDelete={() => act(`${KV2_REQUESTS}/${r.id}/cancel`, t("fin.kv2.request_cancelled"))} />}
                            </div>
                        </div>
                    )
                }
                if (r.status === STATUS.PENDING && operator)
                    return (
                        <div className="flex items-center gap-2 justify-end">
                            <Badge variant="orange" className="w-fit whitespace-nowrap">{t("status.pending")}</Badge>
                            <TableActions onEdit={r.close ? undefined : () => onEdit(r)} onDelete={() => act(`${KV2_REQUESTS}/${r.id}/cancel`, t("fin.kv2.request_cancelled"))} />
                        </div>
                    )
                const [label, variant] = REQ_STATUS[r.status] ?? ["", "secondary"]
                return (
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant={variant} className="w-fit whitespace-nowrap">{label ? t(label) : "—"}</Badge>
                        {r.paid_at && r.status !== STATUS.PENDING && <span className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(r.paid_at)}</span>}
                        {r.status === STATUS.REJECTED && r.rejected_comment && <span className="text-xs text-muted-foreground max-w-56 text-right">{r.rejected_comment}</span>}
                        {r.status === STATUS.REJECTED && operator && (
                            <div className="flex items-center gap-2 mt-1">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1"
                                    disabled={isPending}
                                    onClick={() => (r.close ? act(`${KV2_REQUESTS}/${r.id}/resend`, t("fin.kv2.request_resent")) : onEdit(r))}
                                >
                                    <Pencil size={14} />
                                    {r.close ? t("fin.kv2.recalc_resend") : t("fin.kv2.fix_resend")}
                                </Button>
                                <TableActions onDelete={() => act(`${KV2_REQUESTS}/${r.id}/cancel`, t("fin.kv2.request_cancelled"))} />
                            </div>
                        )}
                    </div>
                )
            }}
            head={
                <Head
                    left={<>{switcher}<Badge>{data?.count ?? 0}</Badge></>}
                    right={<>
                        <Filter
                            value={status}
                            onChange={setStatus}
                            options={[["all", t("fin.kv2.all_statuses")], [String(STATUS.PENDING), t("status.pending")], [String(STATUS.PAID), t("fin.kv2.st_approved")], [String(STATUS.REJECTED), t("vst.st_rejected")], [String(STATUS.CANCELED), t("vst.st_canceled")]]}
                        />
                        {actions}
                    </>}
                />
            }
        />
    )
}
