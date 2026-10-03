import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/format-money"
import { todayIso } from "@/lib/today-iso"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const VILOYAT_TARIFFS = "driver-salaries/viloyat-tariffs"

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
}

export type ViloyatTariffRow = ViloyatTariff & { id: string }

export type ViloyatTariffsResponse = {
    results: ViloyatTariff[]
    viloyats: { id: number; name: string }[]
    prastoy_daily_amount?: string | null
    prastoy_valid_from?: string | null
}

export const localTodayIso = () => todayIso()

export const formatDate = (s?: string | null) => {
    if (!s) return "—"
    const [y, m, d] = s.slice(0, 10).split("-")
    return y && m && d ? `${d}.${m}.${y}` : s
}

export const routeLabel = (
    row: Pick<
        ViloyatTariff,
        "from_region" | "to_region" | "from_region_name" | "to_region_name"
    >,
    internalLabel: (name: string) => string,
) =>
    row.from_region === row.to_region
        ? internalLabel(row.from_region_name)
        : `${row.from_region_name} ↔ ${row.to_region_name}`

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
                id: "valid_from",
                header: t("page.vt_valid_from"),
                enableSorting: false,
                cell: ({ row }) => formatDate(row.original.valid_from),
            },
            {
                id: "upcoming",
                header: t("page.vt_upcoming"),
                enableSorting: false,
                cell: ({ row }) =>
                    row.original.upcoming ? (
                        <Badge variant="outline" className="whitespace-nowrap">
                            {formatDate(row.original.upcoming.valid_from)} —{" "}
                            {formatMoney(row.original.upcoming.amount)}
                        </Badge>
                    ) : null,
            },
        ],
        [t],
    )
}
