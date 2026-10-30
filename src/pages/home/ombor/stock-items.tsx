import { DataTable } from "@/components/ui/datatable"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ConditionBadge, StateBadge } from "./items/cols"
import type { WhItem } from "./items/types"
import { fmtDate } from "./utils"

type Props = {
    data: WhItem[] | undefined
    count: number | undefined
    loading: boolean
    head: ReactNode
    pagination: { totalPages?: number; paramName: string; pageSizeParamName: string }
    onOpen: (id: number) => void
}

const StockItems = ({ data, count, loading, head, pagination, onOpen }: Props) => {
    const { t } = useTranslation()

    const columns = useMemo<ColumnDef<WhItem>[]>(
        () => [
            {
                id: "factory_number",
                header: t("wh.items.factory_number"),
                cell: ({ row }) => <span className="font-mono whitespace-nowrap font-medium">{row.original.factory_number}</span>,
            },
            {
                id: "state",
                header: t("wh.items.state_label"),
                cell: ({ row }) => <StateBadge state={row.original.state} />,
            },
            {
                id: "condition",
                header: t("wh.items.condition_label"),
                cell: ({ row }) => <ConditionBadge condition={row.original.condition} />,
            },
            {
                id: "km",
                header: t("wh.items.km_total"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap tabular-nums">
                        {formatMoney(row.original.km_total ?? 0)} {t("wh.items.km")}
                    </span>
                ),
            },
            {
                id: "price",
                header: t("wh.items.price"),
                cell: ({ row }) => (
                    <span className="font-medium whitespace-nowrap tabular-nums">
                        {formatMoney(row.original.unit_price ?? 0)} {t("page.som")}
                    </span>
                ),
            },
            {
                id: "receipt_date",
                header: t("wh.items.receipt_date"),
                cell: ({ row }) => <span className="whitespace-nowrap">{fmtDate(row.original.receipt_date)}</span>,
            },
        ],
        [t],
    )

    const total = (data ?? []).reduce((s, r) => s + Number(r.unit_price ?? 0), 0)

    return (
        <DataTable
            numeration
            loading={loading}
            columns={columns}
            data={data}
            onRowClick={(row) => onOpen(row.id)}
            height="h-40"
            className="min-w-[900px]"
            paginationProps={pagination}
            head={
                <>
                    {head}
                    <div className="mb-3 text-sm text-muted-foreground">
                        {count ?? 0} {t("wh.stock_pcs")} · {formatMoney(total)} {t("page.som")}
                    </div>
                </>
            }
        />
    )
}

export default StockItems
