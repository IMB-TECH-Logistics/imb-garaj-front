import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { fmtDate } from "../utils"
import type { ItemCondition, ItemState, WhItem } from "./types"

const Dash = () => <span className="text-muted-foreground">—</span>

const STATE_VARIANT: Record<
    ItemState,
    "default" | "secondary" | "destructive" | "orange"
> = {
    in_stock: "default",
    installed: "secondary",
    repair: "orange",
    written_off: "destructive",
}

export const StateBadge = ({ state }: { state: ItemState }) => {
    const { t } = useTranslation()
    return (
        <Badge variant={STATE_VARIANT[state]} className="whitespace-nowrap">
            {t(`wh.items.state.${state}`)}
        </Badge>
    )
}

export const ConditionBadge = ({ condition }: { condition: ItemCondition }) => {
    const { t } = useTranslation()
    return (
        <Badge
            variant={condition === "new" ? "outline" : "secondary"}
            className="whitespace-nowrap"
        >
            {t(`wh.items.condition.${condition}`)}
        </Badge>
    )
}

export const useItemCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<WhItem>[]>(
        () => [
            {
                id: "factory_number",
                header: t("wh.items.factory_number"),
                cell: ({ row }) => (
                    <span className="font-mono whitespace-nowrap font-medium">
                        {row.original.factory_number}
                    </span>
                ),
            },
            {
                id: "product",
                header: t("wh.items.model"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {row.original.product_name}
                    </span>
                ),
            },
            {
                id: "state",
                header: t("wh.items.state_label"),
                cell: ({ row }) => <StateBadge state={row.original.state} />,
            },
            {
                id: "condition",
                header: t("wh.items.condition_label"),
                cell: ({ row }) => (
                    <ConditionBadge condition={row.original.condition} />
                ),
            },
            {
                id: "vehicle",
                header: t("wh.items.vehicle"),
                cell: ({ row }) =>
                    row.original.vehicle_plate ?
                        <div className="whitespace-nowrap">
                            <div className="font-medium">
                                {row.original.vehicle_plate}
                            </div>
                            {row.original.current_tenant_name && (
                                <div className="text-xs text-muted-foreground">
                                    {row.original.current_tenant_name}
                                </div>
                            )}
                        </div>
                    :   <Dash />,
            },
            {
                id: "installed_at",
                header: t("wh.items.installed_at"),
                cell: ({ row }) =>
                    row.original.installed_at ?
                        <span className="whitespace-nowrap">
                            {fmtDate(row.original.installed_at)}
                        </span>
                    :   <Dash />,
            },
            {
                id: "km_total",
                header: t("wh.items.km_total"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.km_total ?? 0)} {t("wh.items.km")}
                    </span>
                ),
            },
            {
                id: "unit_price",
                header: t("wh.items.price"),
                cell: ({ row }) =>
                    row.original.unit_price === null ?
                        <Dash />
                    :   <span className="whitespace-nowrap">
                            {formatMoney(row.original.unit_price)}{" "}
                            {t("page.som")}
                        </span>,
            },
        ],
        [t],
    )
}
