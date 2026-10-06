import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { QrCode } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { WhProduct, WhReceiptLine, WhWithdrawal } from "./types"
import { fmtDate } from "./utils"

const Dash = () => <span className="text-muted-foreground">—</span>

const SourceBadge = ({ source }: { source: "qr" | "manual" }) => {
    const { t } = useTranslation()
    return source === "qr" ?
            <Badge className="gap-1 !px-1.5">
                <QrCode size={12} />
                QR
            </Badge>
        :   <Badge variant="secondary" className="!px-1.5">
                {t("wh.manual")}
            </Badge>
}

export const useProductCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<WhProduct>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.name"),
                cell: ({ row }) => (
                    <div>
                        <div>{row.original.name}</div>
                        {row.original.gtin && (
                            <div className="text-xs text-muted-foreground font-mono">
                                {row.original.gtin}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                id: "category",
                header: t("wh.category"),
                cell: ({ row }) =>
                    row.original.category_name ?
                        <span className="whitespace-nowrap">
                            {row.original.category_name}
                        </span>
                    :   <Dash />,
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
                id: "avg_price",
                header: t("form.unit_price"),
                cell: ({ row }) =>
                    row.original.avg_price === null ?
                        <Dash />
                    :   <span className="whitespace-nowrap">
                            {formatMoney(row.original.avg_price)} {t("page.som")}
                        </span>,
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
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span>{fmtDate(row.original.expires_at)}</span>
                        <SourceBadge source={row.original.source} />
                    </div>
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
