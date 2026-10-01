import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export type SelectableItem = { id: number; name: string }

export type DirectionPrice = {
    id: number
    price: string | number
    valid_from: string
    created?: string
    changed_by?: number | null
    changed_by_name?: string | null
}

export type DirectionRow = {
    id: number
    distributor_id?: number | null
    distributor_name?: string | null
    distributor_code?: string | null
    distributor_district?: string | null
    owner?: number
    owner_name: string
    owner_code: string
    load?: number
    load_name: string
    unload?: number
    unload_name: string
    load_place?: string | null
    unload_place?: string | null
    load_city_name?: string | null
    unload_city_name?: string | null
    load_place_display?: string | null
    unload_place_display?: string | null
    cargo_type?: number
    cargo_type_name: string
    payment_type?: number
    payment_type_name: string
    currency: 1 | 2
    current_price: DirectionPrice | null
    no_price?: boolean
    prices?: DirectionPrice[]
    driver_salary_amount?: string | null
    driver_salary_valid_from?: string | null
    driver_salary_history?: DriverSalaryHistoryItem[]
}

export type DriverSalaryHistoryItem = {
    id: number
    amount: string
    valid_from: string
    created?: string
    changed_by_full_name?: string | null
}

export const formatDate = (s?: string | null) => {
    if (!s) return "—"
    const d = new Date(s)
    if (isNaN(d.getTime())) return s
    return d.toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
}

const formatDateTime = (s?: string | null) => {
    if (!s) return "—"
    const d = new Date(s)
    if (isNaN(d.getTime())) return s
    return d.toLocaleString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })
}

const CURRENCY_LABELS: Record<number, string> = {
    1: "UZS",
    2: "USD",
}


export const useDirectionColumns = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<DirectionRow>[]>(
        () => [
            { accessorKey: "owner_code", header: t("form.company_code"), enableSorting: true, size: 100 },
            { accessorKey: "load_city_name", header: t("form.load_region"), enableSorting: true, cell: ({ row }) => row.original.load_city_name || row.original.load_name || "—" },
            { accessorKey: "load_place_display", header: t("form.load_place"), enableSorting: false, cell: ({ row }) => row.original.load_place_display || "—" },
            { accessorKey: "unload_city_name", header: t("form.unload_region"), enableSorting: true, cell: ({ row }) => row.original.unload_city_name || row.original.unload_name || "—" },
            { accessorKey: "unload_place_display", header: t("form.unload_place"), enableSorting: false, cell: ({ row }) => row.original.unload_place_display || "—" },
            {
                accessorKey: "distributor_name",
                header: t("form.distributor"),
                enableSorting: false,
                cell: ({ row }) => row.original.distributor_name ? (
                    <div className="min-w-[160px] max-w-[240px] truncate">{row.original.distributor_name}</div>
                ) : "—",
            },
            { accessorKey: "owner_name", header: t("form.cargo_owner"), enableSorting: true },
            { accessorKey: "cargo_type_name", header: t("form.cargo_type"), enableSorting: true },
            { accessorKey: "payment_type_name", header: t("form.payment_type"), enableSorting: false },
            {
                id: "price_amount",
                accessorKey: "current_price",
                header: t("form.amount"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <span>
                            {row.original.current_price?.price != null
                                ? formatMoney(
                                      Number(row.original.current_price.price),
                                  )
                                : "—"}
                        </span>
                        {row.original.no_price && (
                            <Badge variant="destructive">
                                {t("form.no_price")}
                            </Badge>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "currency",
                header: t("form.currency"),
                enableSorting: true,
                cell: ({ row }) =>
                    CURRENCY_LABELS[row.original.currency] ?? "-",
            },
        ],
        [t],
    )
}
