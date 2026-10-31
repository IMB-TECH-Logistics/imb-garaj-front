import TableActions from "@/components/custom/table-actions"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import axiosInstance from "@/services/axios-instance"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { LedgerRow, kontragentUrl, num, onApiError, som, useRefreshFinance } from "./api"

export const useLedger = (id: number) => useGet<LedgerRow[]>(kontragentUrl(id, "ledger"))

export const LedgerTable = ({ rows, loading, onlyCash = false }: { rows: LedgerRow[] | undefined; loading?: boolean; onlyCash?: boolean }) => {
    const { t } = useTranslation()
    const refresh = useRefreshFinance()
    const data = useMemo(() => (rows ?? []).filter((r) => !onlyCash || r.kind === "cash"), [rows, onlyCash])

    const remove = (row: LedgerRow) =>
        axiosInstance
            .delete(`/kontragent/entries/${row.id}/`)
            .then(() => {
                toast.success(t("messages.success_delete"))
                refresh()
            })
            .catch(onApiError(t("messages.error")))

    const cols = useMemo<ColumnDef<LedgerRow>[]>(
        () => [
            { accessorKey: "date", header: t("contragent.fields.date"), cell: ({ row }) => format(new Date(row.original.date), "dd.MM.yyyy") },
            {
                accessorKey: "dir",
                header: t("contragent.fields.kind"),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                            variant="outline"
                            className={cn(
                                "font-medium",
                                row.original.dir === "in" ?
                                    "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                :   "bg-green-500/10 text-green-600 border-green-500/30",
                            )}
                        >
                            {t(row.original.dir === "in" ? "contragent.tx.in" : "contragent.tx.out")}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{t(`contragent.kind.${row.original.kind}`)}</span>
                        {row.original.status === "pending" && <Badge variant="orange">{t("contragent.pending")}</Badge>}
                    </div>
                ),
            },
            {
                accessorKey: "amount",
                header: t("contragent.fields.amount"),
                cell: ({ row }) => (
                    <span
                        className={cn(
                            "tabular-nums font-medium whitespace-nowrap",
                            row.original.status === "pending" ? "text-muted-foreground"
                            : row.original.dir === "in" ? "text-amber-600"
                            : "text-green-600",
                        )}
                    >
                        {row.original.dir === "in" ? "+" : "−"} {som(row.original.amount)}
                    </span>
                ),
            },
            {
                accessorKey: "balance",
                header: t("contragent.fields.balance"),
                cell: ({ row }) => {
                    const v = num(row.original.balance)
                    if (row.original.status === "pending") return <span className="text-muted-foreground">—</span>
                    return (
                        <span className={cn("tabular-nums font-semibold whitespace-nowrap", v > 0 && "text-destructive", v < 0 && "text-green-600")}>
                            {v ? som(Math.abs(v)) : t("contragent.settled")}
                        </span>
                    )
                },
            },
            {
                accessorKey: "comment",
                header: t("contragent.fields.comment"),
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span>{row.original.comment || "—"}</span>
                        {row.original.source.type !== "manual" && (
                            <span className="text-xs text-muted-foreground">{t(`contragent.source.${row.original.source.type}`)}</span>
                        )}
                    </div>
                ),
            },
        ],
        [t],
    )

    return (
        <DataTable
            columns={cols}
            data={data}
            loading={loading}
            numeration
            wrapperClassName="p-0"
            rowAction={(row: LedgerRow) => (row.is_manual ? <TableActions onDelete={() => remove(row)} /> : null)}
        />
    )
}
