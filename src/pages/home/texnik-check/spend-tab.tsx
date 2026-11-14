import ParamDateRange from "@/components/as-params/date-picker-range"
import ParamTabs from "@/components/as-params/tabs"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { TECHNICAL_INSPECT } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { fmtDate, toNumber } from "../ombor/utils"
import type { VehicleExpenseRow } from "./cols"

type SpendRow = {
    id: string
    date: string
    vehicle: string
    name: string
    quantity: string | null
    product: number | null
    service: number | null
    payStatus: number | null
}

const flatten = (row: VehicleExpenseRow): SpendRow[] => {
    const base = { date: row.date, vehicle: row.vehicle_name }
    const out: SpendRow[] = (row.items ?? []).map((item) => ({
        ...base,
        id: `p${item.id}`,
        name: item.product_name,
        quantity: `${toNumber(item.quantity).toLocaleString("ru-RU")} ${item.unit_name}`,
        product: Number(item.total) || 0,
        service: null,
        payStatus: null,
    }))
    const services = row.services ?? []
    services.forEach((s) =>
        out.push({
            ...base,
            id: `s${s.id}`,
            name: s.comment || row.comment || "—",
            quantity: null,
            product: null,
            service: Number(s.amount) || 0,
            payStatus: row.payment_status ?? null,
        }),
    )
    if (!services.length && Number(row.amount)) {
        out.push({
            ...base,
            id: `a${row.id}`,
            name: row.comment || row.category_name || "—",
            quantity: null,
            product: null,
            service: Number(row.amount),
            payStatus: row.payment_status ?? null,
        })
    }
    return out
}

export const TexnikTabs = () => {
    const { t } = useTranslation()
    return (
        <ParamTabs
            paramName="ti_kind"
            options={[
                { value: "truck", label: t("texnik.vehicles.truck") },
                { value: "trailer", label: t("tb.trailer") },
                { value: "spend", label: t("texnik.tab_expenses") },
            ]}
        />
    )
}

const SpendTab = () => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as { from_date?: string; to_date?: string; vehicle_search?: string }
    const query = String(search.vehicle_search ?? "")
    const { data, isLoading } = useGet<ListResponse<VehicleExpenseRow>>(TECHNICAL_INSPECT, {
        params: {
            from_date: search.from_date || undefined,
            to_date: search.to_date || undefined,
            page_size: 5000,
        },
    })

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase().replace(/\s/g, "")
        return [...(data?.results ?? [])]
            .filter((r) => !q || (r.vehicle_name ?? "").toLowerCase().replace(/\s/g, "").includes(q))
            .sort((a, b) => b.date.localeCompare(a.date) || (a.vehicle_name ?? "").localeCompare(b.vehicle_name ?? "") || b.id - a.id)
            .flatMap(flatten)
    }, [data, query])

    const totals = useMemo(
        () =>
            rows.reduce(
                (acc, r) => ({ products: acc.products + (r.product ?? 0), service: acc.service + (r.service ?? 0) }),
                { products: 0, service: 0 },
            ),
        [rows],
    )

    const columns = useMemo<ColumnDef<SpendRow>[]>(
        () => [
            {
                id: "date",
                header: t("form.date"),
                cell: ({ row }) => <span className="whitespace-nowrap">{fmtDate(row.original.date)}</span>,
            },
            {
                id: "vehicle",
                header: t("wh.spend.vehicle"),
                cell: ({ row }) => <span className="whitespace-nowrap font-medium">{row.original.vehicle}</span>,
            },
            {
                id: "name",
                header: t("wh.spend.name"),
                cell: ({ row }) => <span>{row.original.name}</span>,
            },
            {
                id: "quantity",
                header: t("form.quantity"),
                cell: ({ row }) => <span className="whitespace-nowrap">{row.original.quantity ?? "—"}</span>,
            },
            {
                id: "product",
                header: t("wh.spend.products_sum"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap tabular-nums font-medium">
                        {row.original.product == null ? "—" : formatMoney(row.original.product)}
                    </span>
                ),
            },
            {
                id: "service",
                header: t("wh.spend.service_sum"),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="tabular-nums font-medium">
                            {row.original.service == null ? "—" : formatMoney(row.original.service)}
                        </span>
                        {row.original.payStatus != null && (
                            <Badge variant={row.original.payStatus === 20 ? "default" : "secondary"}>
                                {t(`wh.tech.pay_status.${row.original.payStatus}`)}
                            </Badge>
                        )}
                    </div>
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
            className="min-w-[900px]"
            head={
                <div className="flex flex-col gap-3 mb-3">
                    <div className="flex justify-between items-center gap-3 flex-wrap">
                        <TexnikTabs />
                        <ParamDateRange
                            from="from_date"
                            to="to_date"
                            addButtonProps={{ className: "!bg-background dark:!bg-secondary min-w-32 justify-start" }}
                        />
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

export default SpendTab
