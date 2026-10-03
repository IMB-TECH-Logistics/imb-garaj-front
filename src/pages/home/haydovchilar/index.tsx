import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { DRIVERS_LIST } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatPhoneNumber } from "@/pages/home/settings/customers/phone-number"
import { formatExperience } from "@/lib/format-experience"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useMemo } from "react"
import { ParamCombobox } from "@/components/as-params/combobox"
import { useTranslation } from "react-i18next"

type DriverRow = {
    id: number
    first_name: string
    last_name: string
    full_name: string
    username: string
    phone: string | null
    experience: number
    hired_at: string | null
    experience_months: number | null
    completed_trips: number
    total_trips: number
    ongoing_trips: number
    completed_orders: number
    total_orders: number
    revenue_uzs: string | number
    revenue_usd: string | number
    salary_paid_uzs: string | number
    total_distance_km: string | number
    total_fuel_liters: string | number
    fuel_per_100km: string | number
    total_fuel_gas: string | number
    fuel_gas_per_100km: string | number
    coverage: number
    balance_uzs: string | number
    salary_balance_uzs?: string | number
    latest_trip_id: number | null
    latest_trip_end: string | null
    score: string | number
    tier: "A" | "B" | "C" | "D"
}

const num = (v: unknown) => Number(v ?? 0) || 0

const TIER_STYLES: Record<DriverRow["tier"], string> = {
    A: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    B: "bg-primary/10 text-primary border-primary/30",
    C: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    D: "bg-rose-500/15 text-rose-500 border-rose-500/30",
}

const useCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<DriverRow>[]>(
        () => [
            {
                header: t("form.first_name"),
                accessorKey: "first_name",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.first_name} {row.original.last_name}
                    </span>
                ),
            },
            {
                header: t("form.phone"),
                accessorKey: "phone",
                cell: ({ row }) =>
                    formatPhoneNumber(row.original.phone || "—"),
            },
            {
                header: t("table.experience"),
                id: "experience",
                accessorFn: (row) =>
                    row.experience_months ?? Number(row.experience || 0) * 12,
                enableSorting: true,
                cell: ({ row }) =>
                    formatExperience(
                        t,
                        row.original.experience_months,
                        row.original.experience,
                    ),
            },
            {
                header: t("page.trips"),
                accessorKey: "completed_orders",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original.completed_orders} /{" "}
                        {row.original.total_orders}
                    </span>
                ),
            },
            {
                header: "Yoqilg’i (l/100km)",
                accessorKey: "fuel_per_100km",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = num(row.original.fuel_per_100km)
                    if (v <= 0)
                        return (
                            <span className="text-muted-foreground">—</span>
                        )
                    const cls =
                        v <= 26
                            ? "text-emerald-500"
                            : v <= 32
                              ? "text-amber-500"
                              : "text-rose-500"
                    return (
                        <span
                            className={`tabular-nums font-medium ${cls}`}
                        >
                            {v.toFixed(1)}
                        </span>
                    )
                },
            },
            {
                header: "Yoqilg’i (m³/100km)",
                accessorKey: "fuel_gas_per_100km",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = num(row.original.fuel_gas_per_100km)
                    if (v <= 0)
                        return (
                            <span className="text-muted-foreground">—</span>
                        )
                    return (
                        <span className="tabular-nums font-medium text-sky-500">
                            {v.toFixed(1)}
                        </span>
                    )
                },
            },
            {
                header: `${t("table.revenue")} (${t("page.som")})`,
                accessorKey: "revenue_uzs",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums font-medium">
                        {formatMoney(num(row.original.revenue_uzs))}
                    </span>
                ),
            },
            {
                header: `${t("form.balance")} (${t("page.som")})`,
                accessorKey: "balance_uzs",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = num(row.original.balance_uzs)
                    const salary = num(row.original.salary_balance_uzs)
                    return (
                        <div className="flex flex-col">
                            <span
                                className={
                                    v < 0
                                        ? "text-red-500 font-medium"
                                        : v > 0
                                          ? "text-green-500 font-medium"
                                          : ""
                                }
                            >
                                {formatMoney(v)}
                            </span>
                            {salary !== 0 && (
                                <span
                                    className={`text-[11px] ${salary > 0 ? "text-red-500" : "text-green-500"}`}
                                    title={t(salary > 0 ? "form.debt_driver_owes" : "form.debt_company_owes")}
                                >
                                    {t("form.salary_diff_driver")}: {formatMoney(salary)}
                                </span>
                            )}
                        </div>
                    )
                },
            },
            {
                header: t("table.rating"),
                accessorKey: "score",
                enableSorting: true,
                cell: ({ row }) => (
                    <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-md border text-[11px] font-bold ${TIER_STYLES[row.original.tier]}`}
                    >
                        {row.original.tier}
                    </span>
                ),
            },
        ],
        [t],
    )
}

const TIER_OPTIONS = [
    { id: "A", name: "A" },
    { id: "B", name: "B" },
    { id: "C", name: "C" },
    { id: "D", name: "D" },
]

export default function HaydovchilarList() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search = useSearch({ strict: false })
    const cols = useCols()

    const { data, isLoading } = useGet<DriverRow[]>(DRIVERS_LIST, {
        params: { search: search.driver_search },
    })

    const rows = useMemo(() => {
        const all = data ?? []
        return search.tier
            ? all.filter((r) => r.tier === search.tier)
            : all
    }, [data, search.tier])

    const handleRowClick = (row: DriverRow) => {
        navigate({
            to: "/haydovchilar/$id",
            params: { id: row.id.toString() },
            search: { name: row.full_name } as any,
        })
    }

    return (
        <DataTable
            loading={isLoading}
            columns={cols}
            data={rows}
            paginationProps={{
                page_sizes: [25, 50, 100, 250, 500],
                PageSize: 50,
            }}
            numeration
            onRowClick={handleRowClick}
            head={
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold">{t("nav.drivers")}</h1>
                        <Badge className="text-sm">
                            {formatMoney(rows.length)}
                        </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <ParamCombobox
                            paramName="tier"
                            options={TIER_OPTIONS}
                            label={t("table.rating")}
                            addButtonProps={{
                                className:
                                    "!bg-background dark:!bg-secondary min-w-36 justify-start",
                            }}
                        />
                    </div>
                </div>
            }
        />
    )
}
