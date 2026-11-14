import ParamDateRange from "@/components/as-params/date-picker-range"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { Input } from "@/components/ui/input"
import { TECHNICAL_INSPECT } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney, formatNumber } from "@/lib/format-money"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { VehicleExpenseRow } from "../texnik-check/cols"
import type { OmborSearchParams } from "./types"
import { fmtDate, toNumber } from "./utils"

const productsSum = (row: VehicleExpenseRow) => Number(row.warehouse_total) || 0
const serviceSum = (row: VehicleExpenseRow) => Number(row.services_total ?? row.amount) || 0

const VehicleSpendSection = () => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as OmborSearchParams
    const [query, setQuery] = useState("")
    const { data, isLoading } = useGet<ListResponse<VehicleExpenseRow>>(TECHNICAL_INSPECT, {
        params: {
            from_date: search.from_date || undefined,
            to_date: search.to_date || undefined,
            page_size: 5000,
        },
    })

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase().replace(/\s/g, "")
        const all = [...(data?.results ?? [])].sort(
            (a, b) => b.date.localeCompare(a.date) || (a.vehicle_name ?? "").localeCompare(b.vehicle_name ?? "") || b.id - a.id,
        )
        if (!q) return all
        return all.filter((r) => (r.vehicle_name ?? "").toLowerCase().replace(/\s/g, "").includes(q))
    }, [data, query])

    const totals = useMemo(
        () =>
            rows.reduce(
                (acc, r) => ({ products: acc.products + productsSum(r), service: acc.service + serviceSum(r) }),
                { products: 0, service: 0 },
            ),
        [rows],
    )

    const columns = useMemo<ColumnDef<VehicleExpenseRow>[]>(
        () => [
            {
                id: "date",
                header: t("form.date"),
                cell: ({ row }) => <span className="whitespace-nowrap">{fmtDate(row.original.date)}</span>,
            },
            {
                id: "vehicle",
                header: t("wh.spend.vehicle"),
                cell: ({ row }) => <span className="whitespace-nowrap font-medium">{row.original.vehicle_name}</span>,
            },
            {
                id: "products",
                header: t("wh.spend.products"),
                cell: ({ row }) => {
                    const items = row.original.items ?? []
                    if (!items.length) return <span className="text-muted-foreground">—</span>
                    return (
                        <div className="flex flex-col gap-0.5 min-w-56">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-baseline justify-between gap-3">
                                    <span>
                                        {item.product_name}
                                        <span className="ml-1.5 text-xs text-muted-foreground whitespace-nowrap">
                                            {formatNumber(toNumber(item.quantity))} {item.unit_name}
                                        </span>
                                    </span>
                                    <span className="whitespace-nowrap tabular-nums text-muted-foreground">
                                        {formatMoney(Number(item.total) || 0)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )
                },
            },
            {
                id: "products_sum",
                header: t("wh.spend.products_sum"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap tabular-nums font-medium">
                        {productsSum(row.original) ? formatMoney(productsSum(row.original)) : "—"}
                    </span>
                ),
            },
            {
                id: "service",
                header: t("wh.spend.service"),
                cell: ({ row }) => {
                    const services = row.original.services ?? []
                    const text = services.map((s) => s.comment).filter(Boolean).join(", ") || row.original.comment
                    return <span className="line-clamp-2 max-w-64 text-muted-foreground" title={text}>{text || "—"}</span>
                },
            },
            {
                id: "service_sum",
                header: t("wh.spend.service_sum"),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="tabular-nums font-medium">
                            {serviceSum(row.original) ? formatMoney(serviceSum(row.original)) : "—"}
                        </span>
                        {row.original.payment_status != null && (
                            <Badge variant={row.original.payment_status === 20 ? "default" : "secondary"}>
                                {t(`wh.tech.pay_status.${row.original.payment_status}`)}
                            </Badge>
                        )}
                    </div>
                ),
            },
            {
                id: "total",
                header: t("page.total"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap tabular-nums font-semibold text-red-600">
                        {formatMoney(productsSum(row.original) + serviceSum(row.original))}
                    </span>
                ),
            },
        ],
        [t],
    )

    return (
        <DataTable
            numeration
            viewAll
            loading={isLoading}
            columns={columns}
            data={rows}
            className="min-w-[980px]"
            head={
                <div className="flex flex-col gap-3 mb-3">
                    <div className="flex justify-between items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg">{t("wh.tab_spend")}</h1>
                            <Badge>{rows.length}</Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ParamDateRange
                                from="from_date"
                                to="to_date"
                                addButtonProps={{ className: "!bg-background dark:!bg-secondary min-w-32 justify-start" }}
                            />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t("wh.spend.vehicle_search")}
                                className="w-48"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { label: t("wh.spend.products_sum"), value: totals.products },
                            { label: t("wh.spend.service_sum"), value: totals.service },
                            { label: t("page.total"), value: totals.products + totals.service },
                        ].map((c) => (
                            <div key={c.label} className="rounded-lg border bg-muted/30 px-4 py-3">
                                <div className="text-sm text-muted-foreground">{c.label}</div>
                                <div className="text-xl font-semibold tabular-nums">
                                    {formatMoney(c.value)} {t("page.som")}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            }
        />
    )
}

export default VehicleSpendSection
