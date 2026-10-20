import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/format-date"
import { ColumnDef } from "@tanstack/react-table"
import { ImageIcon } from "lucide-react"
import { useMemo } from "react"
import { RowMarks } from "../row-extras"
import { useTranslation } from "react-i18next"
import { FinanceRow, formatAmount } from "./types"

// ──── Columns ────

export const useIncomeCols = (opts?: { withCategory?: boolean }) => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<FinanceRow>[]>(
        () => [
            {
                header: t("table.loading"),
                accessorKey: "loading_name",
                cell: ({ row }) => row.original.order ? <span>{row.original.loading_name || "-"}</span> : null,
            },
            {
                header: t("table.unloading_short"),
                accessorKey: "unloading_name",
                cell: ({ row }) => row.original.order ? <span>{row.original.unloading_name || "-"}</span> : null,
            },
            ...(opts?.withCategory ? [{
                header: t("table.category"),
                accessorKey: "category_name",
                enableSorting: true,
                cell: ({ row }: { row: any }) => row.original.category_name || <span className="text-muted-foreground">—</span>,
            }] : []),
            {
                header: t("form.amount"),
                accessorKey: "amount",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-green-500 font-medium">
                        {formatAmount(row.original)}
                    </span>
                ),
            },
            { header: t("form.payment_type"), accessorKey: "payment_type_name", enableSorting: true },
            { header: t("form.comment"), accessorKey: "comment", enableSorting: true },
            {
                header: t("table.created_at"),
                accessorKey: "created",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        {formatDateTime(row.original.created)}
                        <RowMarks row={row.original} />
                    </div>
                ),
            },
        ],
        [opts?.withCategory, t],
    )
}

export const NO_RECEIPT_ROW =
    "!bg-destructive/10 hover:!bg-destructive/15 [&>td]:before:!bg-destructive/10 hover:[&>td]:before:!bg-destructive/15"

export const noReceiptRow = (row: FinanceRow) => (row.action === -1 && !row.receipt ? NO_RECEIPT_ROW : "")

export const ReceiptCell = ({ row }: { row: FinanceRow }) => {
    const { t } = useTranslation()
    if (!row.receipt) return <span className="text-muted-foreground">—</span>
    return (
        <a
            href={row.receipt}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center text-primary hover:opacity-80"
            title={t("trips.kirim.receipt")}
        >
            <ImageIcon size={18} />
        </a>
    )
}

export const useExpenseCols = (opts?: { isFuel?: boolean; withCategory?: boolean }) => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<FinanceRow>[]>(
        () => [
            ...(opts?.withCategory ? [{
                header: t("table.category"),
                accessorKey: "category_name",
                enableSorting: true,
                cell: ({ row }: { row: any }) => row.original.category_name || <span className="text-muted-foreground">—</span>,
            }] : []),
            { header: t("form.comment"), accessorKey: "comment", enableSorting: true },
            {
                header: t("form.amount"),
                accessorKey: "amount",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-red-500 font-medium">
                        - {formatAmount(row.original)}
                    </span>
                ),
            },
            ...(opts?.isFuel ? [{
                header: t("form.quantity"),
                accessorKey: "quantity",
                enableSorting: true,
                cell: ({ row }: { row: any }) => {
                    const q = row.original.quantity
                    return q ? <span className="font-medium">{q}</span> : <span className="text-muted-foreground">—</span>
                },
            }] : []),
            { header: t("form.payment_type"), accessorKey: "payment_type_name", enableSorting: true },
            {
                header: t("trips.kirim.receipt"),
                id: "receipt",
                cell: ({ row }) => <ReceiptCell row={row.original} />,
            },
            {
                header: t("table.created_at"),
                accessorKey: "created",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        {formatDateTime(row.original.created)}
                        <RowMarks row={row.original} />
                        {row.original.added_after_close && (
                            <Badge variant="outline" className="border-amber-500 text-amber-600 whitespace-nowrap">
                                {t("page.added_after_close")}
                            </Badge>
                        )}
                    </div>
                ),
            },
        ],
        [opts?.isFuel, opts?.withCategory, t],
    )
}
