import { ParamCombobox } from "@/components/as-params/combobox"
import DownloadAsExcel from "@/components/download-as-excel"
import { DataTable } from "@/components/ui/datatable"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CHECKOUT_REPORT_MONTHLY } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { uz } from "date-fns/locale"
import { format } from "date-fns"
import { Info } from "lucide-react"
import { ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"

type MonthlyReportRow = {
    month: number
    start_balance: string
    income: string
    outcome: string
    end_balance: string
    by_source: Record<string, number>
}

type ReportRow = MonthlyReportRow & { isTotal?: boolean }

const SOURCE_LABEL_KEYS: Record<string, string> = {
    order_cashflow: "kassa.source_order_cashflow",
    trip_cashflow: "kassa.source_trip_cashflow",
    technical_inspection: "kassa.source_technical_inspection",
    checkout: "kassa.source_checkout",
    request: "kassa.source_request",
    transfer: "kassa.source_transfer",
}

const monthName = (month: number) =>
    format(new Date(2000, month - 1, 1), "LLLL", { locale: uz })

const useReportCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<ReportRow>[]>(
        () => [
            {
                header: t("kassa.report_month"),
                accessorKey: "month",
                cell: ({ row }) =>
                    row.original.isTotal ?
                        t("kassa.report_total")
                    :   monthName(row.original.month),
            },
            {
                header: t("kassa.report_start_balance"),
                accessorKey: "start_balance",
                cell: ({ row }) => formatMoney(Number(row.original.start_balance)),
            },
            {
                header: t("kassa.report_income"),
                accessorKey: "income",
                cell: ({ row }) => (
                    <span className="text-green-600">
                        {formatMoney(Number(row.original.income))}
                    </span>
                ),
            },
            {
                header: t("kassa.report_outcome"),
                accessorKey: "outcome",
                cell: ({ row }) => (
                    <span className="text-destructive">
                        {formatMoney(Number(row.original.outcome))}
                    </span>
                ),
            },
            {
                header: t("kassa.report_end_balance"),
                accessorKey: "end_balance",
                cell: ({ row }) => formatMoney(Number(row.original.end_balance)),
            },
            {
                header: t("kassa.report_breakdown"),
                id: "breakdown",
                cell: ({ row }) => {
                    const entries = Object.entries(row.original.by_source || {}).filter(
                        ([, v]) => Number(v) !== 0,
                    )
                    if (row.original.isTotal || entries.length === 0) return "—"
                    return (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
                                >
                                    <Info size={16} />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 text-sm space-y-1">
                                {entries.map(([key, value]) => (
                                    <div key={key} className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">
                                            {t(SOURCE_LABEL_KEYS[key] ?? key, key)}
                                        </span>
                                        <span
                                            className={cn(
                                                Number(value) > 0 ?
                                                    "text-green-600"
                                                :   "text-destructive",
                                            )}
                                        >
                                            {Number(value) > 0 ? "+" : ""}
                                            {formatMoney(Number(value))}
                                        </span>
                                    </div>
                                ))}
                            </PopoverContent>
                        </Popover>
                    )
                },
            },
        ],
        [t],
    )
}

type Props = {
    switcher: ReactNode
}

const CheckoutReport = ({ switcher }: Props) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search = useSearch({ strict: false }) as any
    const columns = useReportCols()

    const currentYear = new Date().getFullYear()
    const year = search.report_year ? Number(search.report_year) : currentYear
    const kind: "cash" | "card" = search.report_kind === "card" ? "card" : "cash"

    const yearOptions = useMemo(
        () =>
            Array.from({ length: 6 }, (_, i) => currentYear - i).map((y) => ({
                id: String(y),
                name: String(y),
            })),
        [currentYear],
    )

    const params = { year, checkout_kind: kind }
    const { data, isLoading } = useGet<MonthlyReportRow[]>(CHECKOUT_REPORT_MONTHLY, { params })

    const rows: ReportRow[] = data ?? []
    const totalRow: ReportRow | null =
        rows.length > 0 ?
            {
                month: 0,
                start_balance: rows[0].start_balance,
                income: String(rows.reduce((s, r) => s + Number(r.income), 0)),
                outcome: String(rows.reduce((s, r) => s + Number(r.outcome), 0)),
                end_balance: rows[rows.length - 1].end_balance,
                by_source: {},
                isTotal: true,
            }
        :   null

    const handleKindChange = (val: string) => {
        navigate({ search: { ...search, report_kind: val === "card" ? "card" : undefined } as any })
    }

    return (
        <DataTable
            columns={columns}
            data={totalRow ? [...rows, totalRow] : rows}
            loading={isLoading}
            rowColor={(row) => (row.isTotal ? "font-semibold bg-muted/70" : "")}
            wrapperClassName="md:h-full flex flex-col"
            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
            head={
                <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">{switcher}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Tabs value={kind} onValueChange={handleKindChange}>
                            <TabsList className="h-9">
                                <TabsTrigger value="cash">{t("kassa.cash")}</TabsTrigger>
                                <TabsTrigger value="card">{t("kassa.card")}</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <ParamCombobox
                            paramName="report_year"
                            options={yearOptions}
                            isSearch={false}
                            label={t("kassa.report_year")}
                            addButtonProps={{
                                className: "!bg-background dark:!bg-secondary min-w-24 justify-start",
                            }}
                        />
                        <DownloadAsExcel
                            url={`${CHECKOUT_REPORT_MONTHLY}/excel`}
                            name={t("kassa.report_tab")}
                            params={params}
                        />
                    </div>
                </div>
            }
        />
    )
}

export default CheckoutReport
