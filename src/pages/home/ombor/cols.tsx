import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { WhProduct, WhReceiptLine, WhWithdrawal } from "./types"
import { fmtDate } from "./utils"

const Dash = () => <span className="text-muted-foreground">—</span>

export const useProductCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<WhProduct>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.name"),
                cell: ({ row }) => (
                    <div>
                        <div className="flex items-center gap-2">
                            <span>{row.original.name}</span>
                            {row.original.is_serialized && (
                                <Badge>{t("wh.serialized_yes")}</Badge>
                            )}
                        </div>
                    </div>
                ),
            },
            {
                id: "quantity",
                header: t("form.quantity"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.qty_left)}{" "}
                        {row.original.unit_name}
                    </span>
                ),
            },
            {
                id: "value",
                header: t("wh.total_sum"),
                cell: ({ row }) => (
                    <span className="font-medium whitespace-nowrap">
                        {formatMoney(row.original.value)} {t("page.som")}
                    </span>
                ),
            },
        ],
        [t],
    )
}

export const useReceiptCols = (hideProduct: boolean) => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<WhReceiptLine>[]>(() => {
        const product: ColumnDef<WhReceiptLine> = {
            id: "product",
            header: t("wh.product"),
            cell: ({ row }) => (
                <span className="whitespace-nowrap font-medium">
                    {row.original.product_name}
                </span>
            ),
        }
        const rest: ColumnDef<WhReceiptLine>[] = [
            {
                id: "date",
                header: t("form.date"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {fmtDate(row.original.date)}
                    </span>
                ),
            },
            {
                id: "lot",
                header: t("wh.lot"),
                cell: ({ row }) =>
                    row.original.lot_number ?
                        <span className="font-mono whitespace-nowrap">
                            {row.original.lot_number}
                        </span>
                    :   <Dash />,
            },
            {
                id: "expires",
                header: t("wh.expiry"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {fmtDate(row.original.expires_at)}
                    </span>
                ),
            },
            {
                id: "quantity",
                header: t("form.quantity"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.quantity)}{" "}
                        {row.original.unit_name}
                    </span>
                ),
            },
            {
                id: "unit_price",
                header: t("wh.unit_price"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.unit_price)} {t("page.som")}
                    </span>
                ),
            },
            {
                id: "total",
                header: t("form.amount"),
                cell: ({ row }) => (
                    <span className="font-medium whitespace-nowrap">
                        {formatMoney(row.original.total)} {t("page.som")}
                    </span>
                ),
            },
            {
                id: "comment",
                header: t("form.comment"),
                cell: ({ row }) =>
                    row.original.comment ?
                        <span className="text-muted-foreground inline-block min-w-32">
                            {row.original.comment}
                        </span>
                    :   <Dash />,
            },
        ]
        return hideProduct ? rest : [product, ...rest]
    }, [t, hideProduct])
}

export const useWithdrawalCols = (opts: {
    hideProduct: boolean
    showTenant: boolean
}) => {
    const { t } = useTranslation()
    const { hideProduct, showTenant } = opts
    return useMemo<ColumnDef<WhWithdrawal>[]>(() => {
        const columns: ColumnDef<WhWithdrawal>[] = []
        if (!hideProduct) {
            columns.push({
                id: "product",
                header: t("wh.product"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap font-medium">
                        {row.original.product_name}
                    </span>
                ),
            })
        }
        columns.push({
            id: "date",
            header: t("form.date"),
            cell: ({ row }) => (
                <span className="whitespace-nowrap">
                    {fmtDate(row.original.date)}
                </span>
            ),
        })
        if (showTenant) {
            columns.push({
                id: "tenant",
                header: t("wh.tenant"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {row.original.tenant_name}
                    </span>
                ),
            })
        }
        columns.push(
            {
                id: "vehicle",
                header: t("wh.plate"),
                cell: ({ row }) =>
                    row.original.vehicle_plate ?
                        <span className="font-medium whitespace-nowrap">
                            {row.original.vehicle_plate}
                        </span>
                    :   <Dash />,
            },
            {
                id: "lot",
                header: t("wh.lot"),
                cell: ({ row }) =>
                    row.original.lot_number ?
                        <span className="font-mono whitespace-nowrap">
                            {row.original.lot_number}
                        </span>
                    :   <Dash />,
            },
            {
                id: "quantity",
                header: t("form.quantity"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.quantity)}{" "}
                        {row.original.unit_name}
                    </span>
                ),
            },
            {
                id: "source",
                header: t("form.source"),
                cell: ({ row }) =>
                    row.original.inspection_id ?
                        <Badge variant="secondary">
                            {t("wh.source_inspection", {
                                id: row.original.inspection_id,
                            })}
                        </Badge>
                    :   <Dash />,
            },
        )
        return columns
    }, [t, hideProduct, showTenant])
}
