import { DataTable } from "@/components/ui/datatable"
import {
    OWNER_INVESTORS,
    OWNER_MONTHLY_STATISTIC,
    OWNER_VEHICLE_EXPENSES,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTranslation } from "react-i18next"

export type Investor = { id: number; name: string; vehicle_count: number }

type ExpenseItem = {
    id: string
    source: "kassa" | "inspection" | "warehouse"
    date: string
    category: string
    amount: string
    comment: string
    vehicle_id: number
    truck_number: string
}

type VehicleExpenseGroup = {
    id: number
    truck_number: string
    count: number
    total: number
}

type ExpenseResponse = {
    total: string
    by_category: { category: string; amount: string }[]
    items: ExpenseItem[]
}

type MonthRow = {
    id?: string
    month: string
    trip_count: number
    order_count: number
    unpriced_count: number
    income: string | number
    trip_expense: string | number
    trip_profit: string | number
    vehicle_expense: string | number
    net: string | number
    is_total?: boolean
}

const SOURCE_LABEL_KEY: Record<ExpenseItem["source"], string> = {
    kassa: "fin.inv.source_kassa",
    inspection: "fin.kv2_expense_type.texnik_korik",
    warehouse: "fin.kv2.warehouse",
}

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const

const toNum = (v: string | number | null | undefined) => Number(v ?? 0) || 0

const monthLabel = (m: string, t: (key: string) => string) => {
    const [y, mm] = m.split("-")
    const key = MONTH_KEYS[Number(mm) - 1]
    return `${key ? t(`fin.months_full.${key}`) : mm} ${y}`
}

const Money = ({ value, tone }: { value: string | number; tone?: "income" | "expense" | "auto" }) => {
    const n = toNum(value)
    const color =
        tone === "income" ? "text-green-600"
        : tone === "expense" ? "text-red-600"
        : tone === "auto" ? (n >= 0 ? "text-blue-600" : "text-red-600")
        : ""
    const sign = tone === "expense" && n > 0 ? "−" : ""
    return <span className={`font-medium tabular-nums ${color}`}>{n ? <>{sign}{formatMoney(n)}</> : "—"}</span>
}

export const useInvestors = () => {
    const { data } = useGet<Investor[]>(OWNER_INVESTORS, {
        options: { queryKey: [OWNER_INVESTORS] },
    })
    return data ?? []
}

const useReportParams = (vehicleId?: string | number) => {
    const search: any = useSearch({ strict: false })
    return {
        from_date: search?.from_date,
        to_date: search?.to_date,
        owner: vehicleId ? undefined : search?.owner,
        vehicle_id: vehicleId,
    }
}

export const VehicleExpenses = ({ vehicleId }: { vehicleId?: string | number }) => {
    const { t } = useTranslation()
    const params = useReportParams(vehicleId)
    const { data, isLoading } = useGet<ExpenseResponse>(OWNER_VEHICLE_EXPENSES, {
        params,
        enabled: !!params.from_date && !!params.to_date,
    })

    const items = data?.items ?? []

    const columns = useMemo<ColumnDef<ExpenseItem>[]>(
        () => [
            { header: t("form.date"), accessorKey: "date" },
            ...(vehicleId ?
                []
            :   [{
                    header: t("vst.vehicle_short"),
                    accessorKey: "truck_number",
                } as ColumnDef<ExpenseItem>]),
            {
                header: t("table.type"),
                accessorKey: "category",
                cell: ({ row }) => <span className="font-medium">{row.original.category}</span>,
            },
            {
                header: t("form.amount"),
                accessorKey: "amount",
                cell: ({ row }) => <Money value={row.original.amount} tone="expense" />,
            },
            {
                header: t("table.source"),
                accessorKey: "source",
                cell: ({ row }) => (
                    <span className="text-xs bg-muted py-0.5 px-2 rounded-sm">
                        {SOURCE_LABEL_KEY[row.original.source] ? t(SOURCE_LABEL_KEY[row.original.source]) : row.original.source}
                    </span>
                ),
            },
            {
                header: t("form.comment"),
                accessorKey: "comment",
                cell: ({ row }) => (
                    <span className="text-muted-foreground">{row.original.comment || "—"}</span>
                ),
            },
        ],
        [vehicleId, t],
    )

    const [openVehicle, setOpenVehicle] = useState<number | null>(null)

    const vehicles = useMemo(() => {
        const map = new Map<number, VehicleExpenseGroup>()
        for (const item of items) {
            const g = map.get(item.vehicle_id) ?? {
                id: item.vehicle_id,
                truck_number: item.truck_number,
                count: 0,
                total: 0,
            }
            g.count += 1
            g.total += toNum(item.amount)
            map.set(item.vehicle_id, g)
        }
        return [...map.values()].sort((a, b) => b.total - a.total)
    }, [items])

    const vehicleColumns = useMemo<ColumnDef<VehicleExpenseGroup>[]>(
        () => [
            {
                header: t("vst.vehicle_short"),
                accessorKey: "truck_number",
                cell: ({ row }) => <span className="font-medium">{row.original.truck_number}</span>,
            },
            { header: t("fin.inv.expenses_count"), accessorKey: "count" },
            {
                header: t("table.total_expense"),
                accessorKey: "total",
                cell: ({ row }) => <Money value={row.original.total} tone="expense" />,
            },
        ],
        [t],
    )

    if (vehicleId) {
        return (
            <div className="space-y-3">
                <DataTable
                    columns={columns}
                    data={items}
                    loading={isLoading}
                    numeration
                    viewAll
                />
            </div>
        )
    }

    const opened = vehicles.find((v) => v.id === openVehicle) ?? null
    const openedItems = opened ? items.filter((i) => i.vehicle_id === opened.id) : []
    const detailColumns = columns.filter(
        (c) => (c as { accessorKey?: string }).accessorKey !== "truck_number",
    )

    return (
        <div className="space-y-3">
            <DataTable
                columns={vehicleColumns}
                data={vehicles}
                loading={isLoading}
                numeration
                viewAll
                onRowClick={(row: VehicleExpenseGroup) => setOpenVehicle(row.id)}
            />
            <Sheet open={!!opened} onOpenChange={(open) => !open && setOpenVehicle(null)}>
                <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-3">
                            {opened?.truck_number}
                            {opened && <Money value={opened.total} tone="expense" />}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                        <DataTable columns={detailColumns} data={openedItems} numeration viewAll />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}

export const MonthlyReport = ({ vehicleId }: { vehicleId?: string | number }) => {
    const { t } = useTranslation()
    const params = useReportParams(vehicleId)
    const { data, isLoading } = useGet<MonthRow[]>(OWNER_MONTHLY_STATISTIC, {
        params,
        enabled: !!params.from_date && !!params.to_date,
    })

    const rows = useMemo<MonthRow[]>(() => {
        const list = (data ?? []).map((r) => ({ ...r, id: r.month }))
        if (list.length < 2) return list
        const sum = (k: keyof MonthRow) => list.reduce((acc, r) => acc + toNum(r[k] as any), 0)
        return [
            ...list,
            {
                id: "total",
                month: "total",
                trip_count: sum("trip_count"),
                order_count: sum("order_count"),
                unpriced_count: sum("unpriced_count"),
                income: sum("income"),
                trip_expense: sum("trip_expense"),
                trip_profit: sum("trip_profit"),
                vehicle_expense: sum("vehicle_expense"),
                net: sum("net"),
                is_total: true,
            },
        ]
    }, [data])

    const columns = useMemo<ColumnDef<MonthRow>[]>(
        () => [
            {
                header: t("kassa.report_month"),
                accessorKey: "month",
                cell: ({ row }) => (
                    <span className="font-semibold">
                        {row.original.is_total ? t("page.total") : monthLabel(row.original.month, t)}
                    </span>
                ),
            },
            { header: t("fin.kv2.tab_trips"), accessorKey: "trip_count" },
            { header: t("page.trips"), accessorKey: "order_count" },
            {
                header: t("fin.cols.unpriced_trips"),
                accessorKey: "unpriced_count",
                cell: ({ row }) =>
                    row.original.unpriced_count ?
                        <span className="text-xs font-medium py-0.5 px-2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            {row.original.unpriced_count}
                        </span>
                    :   <span className="text-muted-foreground">—</span>,
            },
            {
                header: t("fin.cols.trip_income"),
                accessorKey: "income",
                cell: ({ row }) => <Money value={row.original.income} tone="income" />,
            },
            {
                header: t("fin.finance_main.trip_expense"),
                accessorKey: "trip_expense",
                cell: ({ row }) => <Money value={row.original.trip_expense} tone="expense" />,
            },
            {
                header: t("fin.cols.trip_profit"),
                accessorKey: "trip_profit",
                cell: ({ row }) => <Money value={row.original.trip_profit} tone="auto" />,
            },
            {
                header: t("fin.cols.vehicle_expense"),
                accessorKey: "vehicle_expense",
                cell: ({ row }) => <Money value={row.original.vehicle_expense} tone="expense" />,
            },
            {
                header: t("fin.inv.net_result"),
                accessorKey: "net",
                cell: ({ row }) => <Money value={row.original.net} tone="auto" />,
            },
        ],
        [t],
    )

    return (
        <div className="space-y-2">
            <DataTable
                columns={columns}
                data={rows}
                loading={isLoading}
                viewAll
                rowColor={(row: any) =>
                    row.is_total ? "!bg-slate-200 dark:!bg-slate-700 hover:!bg-slate-200 dark:hover:!bg-slate-700" : ""
                }
            />
        </div>
    )
}
