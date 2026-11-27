import { formatMoney } from "@/lib/format-money"
import { todayIso } from "@/lib/today-iso"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const VILOYAT_TARIFFS = "driver-salaries/viloyat-tariffs"
export const SEPARATE_CITIES = "driver-salaries/viloyat-tariffs/cities"

export type TariffHistoryItem = { amount: string; valid_from: string }

export type ViloyatTariff = {
    key: string
    from_region: number
    from_region_name: string
    to_region: number
    to_region_name: string
    amount: string | null
    valid_from: string | null
    history: TariffHistoryItem[]
    upcoming: TariffHistoryItem | null
    from_is_city?: boolean
    to_is_city?: boolean
    orders_count?: number
    unpriced_count?: number
}

export type ViloyatTariffRow = ViloyatTariff & { id: string }

export type ViloyatTariffsResponse = {
    results: ViloyatTariff[]
    viloyats: { id: number; name: string }[]
    cities?: { id: number; name: string; viloyat: number; viloyat_name: string }[]
    recent_days?: number
    prastoy_daily_amount?: string | null
    prastoy_valid_from?: string | null
}

export const localTodayIso = () => todayIso()

export const formatDate = (s?: string | null) => {
    if (!s) return "—"
    const [y, m, d] = s.slice(0, 10).split("-")
    return y && m && d ? `${d}/${m}/${y}` : s
}

export const routeLabel = (
    row: Pick<
        ViloyatTariff,
        "from_region" | "to_region" | "from_region_name" | "to_region_name"
    >,
    internalLabel: (name: string) => string,
) =>
    `${row.from_region_name} → ${row.to_region_name}`

export const useSalaryColumns = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<ViloyatTariffRow>[]>(
        () => [
            {
                id: "route",
                header: t("page.vt_route"),
                enableSorting: false,
                cell: ({ row }) =>
                    routeLabel(row.original, (name) =>
                        t("page.vt_internal", { name }),
                    ),
            },
            {
                id: "amount",
                header: t("page.vt_amount"),
                enableSorting: false,
                cell: ({ row }) =>
                    row.original.amount == null ? (
                        "—"
                    ) : (
                        formatMoney(row.original.amount)
                    ),
            },
            {
                id: "orders",
                header: t("page.vt_orders"),
                enableSorting: false,
                cell: ({ row }) => {
                    const total = row.original.orders_count ?? 0
                    const missing = row.original.unpriced_count ?? 0
                    if (!total) return <span className="text-muted-foreground">—</span>
                    return (
                        <span className="flex items-center gap-2">
                            {total}
                            {missing > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                    {t("page.vt_unpriced", { count: missing })}
                                </Badge>
                            )}
                        </span>
                    )
                },
            },
            {
                id: "valid_from",
                header: t("page.vt_valid_from"),
                enableSorting: false,
                cell: ({ row }) => formatDate(row.original.valid_from),
            },
        ],
        [t],
    )
}
