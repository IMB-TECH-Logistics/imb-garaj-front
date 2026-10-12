import { useMemo } from "react"
import {
    Bar,
    Area,
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
} from "recharts"
import { useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useGet } from "@/hooks/useGet"
import { FINANCE_INCOME_EXPENSE } from "@/constants/api-endpoints"
import { useGlobalStore } from "@/store/global-store"
import { PALETTES, PALETTE_STORE_KEY } from "./palettes"

type IncomeExpensePoint = {
    date: string
    tushum: string | number
    xarajat: string | number
    foyda: string | number
}

type CompactUnits = { bn: string; mn: string; k: string }

const formatCompact = (v: number, u: CompactUnits) => {
    const abs = Math.abs(v)
    if (abs >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + " " + u.bn
    if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + " " + u.mn
    if (abs >= 1_000) return (v / 1_000).toFixed(0) + " " + u.k
    return v.toFixed(0)
}

const formatFull = (v: number, unit: string) =>
    new Intl.NumberFormat("uz-UZ").format(Math.round(v)) + " " + unit

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const

function isMonthRange(from?: string, to?: string) {
    if (!from || !to) return false
    const fd = new Date(from), td = new Date(to)
    return fd.getFullYear() === td.getFullYear() && fd.getMonth() === td.getMonth()
}

function CustomTooltip({ active, payload, label }: any) {
    const { t } = useTranslation()
    if (!active || !payload?.length) return null
    return (
        <div className="bg-popover/95 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-xl text-xs space-y-1">
            <p className="font-semibold text-foreground">{label}</p>
            {payload.map((entry: any) => (
                <div key={entry.dataKey} className="flex items-center gap-2">
                    <span className="size-2 rounded-full shrink-0" style={{ background: entry.color || entry.stroke }} />
                    <span className="text-muted-foreground">{entry.name}:</span>
                    <span className="font-medium text-foreground">{formatFull(entry.value, t("page.som"))}</span>
                </div>
            ))}
        </div>
    )
}

export default function IncomeExpenseChart() {
    const { t } = useTranslation()
    const search: any = useSearch({ strict: false })
    const { getData } = useGlobalStore()
    const paletteIdx = getData<number>(PALETTE_STORE_KEY) ?? 0
    const p = PALETTES[paletteIdx] ?? PALETTES[0]
    const units: CompactUnits = {
        bn: t("fin.units.billion_short"),
        mn: t("fin.units.million_short"),
        k: t("fin.units.thousand_short"),
    }
    const formatCompactT = (v: number) => formatCompact(v, units)
    const monthName = (i: number) => t(`fin.months_short.${MONTH_KEYS[i]}`)

    const isDaily = isMonthRange(search?.from_date, search?.to_date)
    const selectedMonth = isDaily ? new Date(search.from_date).getMonth() : null
    const selectedYear = isDaily ? new Date(search.from_date).getFullYear() : null

    const { data: raw } = useGet<IncomeExpensePoint[]>(FINANCE_INCOME_EXPENSE, {
        params: { from_date: search?.from_date, to_date: search?.to_date },
    })

    const chartData = useMemo(() => {
        const rows = raw ?? []
        return rows.map((r) => {
            const d = new Date(r.date)
            const name = isDaily
                ? String(d.getDate())
                : `${monthName(d.getMonth())}'${String(d.getFullYear()).slice(2)}`
            return {
                name,
                tushum: Number(r.tushum),
                xarajat: Number(r.xarajat),
                foyda: Number(r.foyda),
            }
        })
    }, [raw, isDaily, t])

    const totals = useMemo(() => ({
        income: chartData.reduce((s, i) => s + i.tushum, 0),
        expense: chartData.reduce((s, i) => s + i.xarajat, 0),
        profit: chartData.reduce((s, i) => s + i.foyda, 0),
    }), [chartData])

    const yMax = useMemo(() => {
        let max = 0
        for (const d of chartData) max = Math.max(max, d.tushum, d.xarajat)
        return Math.ceil(max * 1.1)
    }, [chartData])

    return (
        <div className="flex flex-col h-full p-3 gap-2">
            {/* Title + Legend */}
            <div className="flex items-center justify-between shrink-0 pr-10">
                <span className="text-xs font-semibold">
                    {t("fin.income_expense.title", { income: t("form.income"), expense: t("form.expense") })}
                    <span className="text-muted-foreground font-normal ml-1.5">
                        {isDaily ? t("fin.income_expense.daily", { month: monthName(selectedMonth!), year: selectedYear }) : t("fin.income_expense.monthly")}
                    </span>
                </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs shrink-0 pr-10">
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full transition-colors" style={{ background: p.income }} />
                    <span className="text-muted-foreground">{t("form.income")}:</span>
                    <span className="font-semibold transition-colors" style={{ color: p.income }}>{formatCompactT(totals.income)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full transition-colors" style={{ background: p.expense }} />
                    <span className="text-muted-foreground">{t("form.expense")}:</span>
                    <span className="font-semibold transition-colors" style={{ color: p.expense }}>{formatCompactT(totals.expense)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full transition-colors" style={{ background: p.profit }} />
                    <span className="text-muted-foreground">{t("table.profit")}:</span>
                    <span className="font-semibold transition-colors" style={{ color: p.profit }}>{formatCompactT(totals.profit)}</span>
                </div>
            </div>

            {/* Single composed chart */}
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} barGap={2} barCategoryGap="15%">
                        <defs>
                            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={p.profit} stopOpacity={0.2} />
                                <stop offset="100%" stopColor={p.profit} stopOpacity={0.01} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            fontSize={9}
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                            interval={isDaily ? 1 : 0}
                            height={30}
                        />
                        <YAxis
                            yAxisId="left"
                            tickLine={false}
                            axisLine={false}
                            fontSize={9}
                            tickFormatter={formatCompactT}
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                            width={55}
                            domain={[0, yMax]}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                            fontSize={9}
                            tickFormatter={formatCompactT}
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                            width={55}
                            domain={[0, yMax]}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "hsl(var(--foreground))", opacity: 0.05 }}
                        />
                        <Bar yAxisId="left" dataKey="tushum" name={t("form.income")} fill={p.income} opacity={0.85} radius={[3, 3, 0, 0]} />
                        <Bar yAxisId="left" dataKey="xarajat" name={t("form.expense")} fill={p.expense} opacity={0.85} radius={[3, 3, 0, 0]} />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="foyda"
                            name={t("table.profit")}
                            stroke={p.profit}
                            strokeWidth={2.5}
                            fill="url(#profitGradient)"
                            dot={{ r: 2.5, fill: p.profit, stroke: p.profit, strokeWidth: 1 }}
                            activeDot={{ r: 5, fill: p.profit, stroke: p.profitDark, strokeWidth: 2 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
