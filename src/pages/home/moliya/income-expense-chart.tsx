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
import { useGlobalStore } from "@/store/global-store"
import { PALETTES, PALETTE_STORE_KEY } from "./palettes"

const formatCompact = (v: number) => {
    const abs = Math.abs(v)
    if (abs >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + " mlrd"
    if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + " mln"
    if (abs >= 1_000) return (v / 1_000).toFixed(0) + " ming"
    return v.toFixed(0)
}

const formatFull = (v: number) =>
    new Intl.NumberFormat("uz-UZ").format(Math.round(v)) + " so'm"

const MONTHS_UZ = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"]

function generateMonthlyData() {
    const data = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const month = MONTHS_UZ[d.getMonth()]
        const yr = String(d.getFullYear()).slice(2)
        const tushum = Math.round((Math.random() * 60 + 20) * 1_000_000)
        const xarajat = Math.round((Math.random() * 40 + 10) * 1_000_000)
        data.push({ name: `${month}'${yr}`, tushum, xarajat, foyda: Math.max(0, tushum - xarajat) })
    }
    return data
}

function generateDailyData(year: number, month: number) {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const data = []
    for (let day = 1; day <= daysInMonth; day++) {
        const tushum = Math.round((Math.random() * 8 + 1) * 1_000_000)
        const xarajat = Math.round((Math.random() * 5 + 0.5) * 1_000_000)
        data.push({ name: String(day), tushum, xarajat, foyda: Math.max(0, tushum - xarajat) })
    }
    return data
}

function isMonthRange(from?: string, to?: string) {
    if (!from || !to) return false
    const fd = new Date(from), td = new Date(to)
    return fd.getFullYear() === td.getFullYear() && fd.getMonth() === td.getMonth()
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-popover/95 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-xl text-xs space-y-1">
            <p className="font-semibold text-foreground">{label}</p>
            {payload.map((entry: any) => (
                <div key={entry.dataKey} className="flex items-center gap-2">
                    <span className="size-2 rounded-full shrink-0" style={{ background: entry.color || entry.stroke }} />
                    <span className="text-muted-foreground">{entry.name}:</span>
                    <span className="font-medium text-foreground">{formatFull(entry.value)}</span>
                </div>
            ))}
        </div>
    )
}

export default function IncomeExpenseChart() {
    const search: any = useSearch({ strict: false })
    const { getData } = useGlobalStore()
    const paletteIdx = getData<number>(PALETTE_STORE_KEY) ?? 0
    const p = PALETTES[paletteIdx] ?? PALETTES[0]

    const isDaily = isMonthRange(search?.from_date, search?.to_date)
    const selectedMonth = isDaily ? new Date(search.from_date).getMonth() : null
    const selectedYear = isDaily ? new Date(search.from_date).getFullYear() : null

    const chartData = useMemo(() => {
        if (isDaily && selectedYear != null && selectedMonth != null) return generateDailyData(selectedYear, selectedMonth)
        return generateMonthlyData()
    }, [isDaily, selectedYear, selectedMonth])

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
            <div className="flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold">
                    Tushum va Xarajat
                    <span className="text-muted-foreground font-normal ml-1.5">
                        {isDaily ? `${MONTHS_UZ[selectedMonth!]} ${selectedYear} — kunlik` : "oylik"}
                    </span>
                </span>
            </div>
            <div className="flex items-center gap-4 text-xs shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full transition-colors" style={{ background: p.income }} />
                    <span className="text-muted-foreground">Tushum:</span>
                    <span className="font-semibold transition-colors" style={{ color: p.income }}>{formatCompact(totals.income)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full transition-colors" style={{ background: p.expense }} />
                    <span className="text-muted-foreground">Xarajat:</span>
                    <span className="font-semibold transition-colors" style={{ color: p.expense }}>{formatCompact(totals.expense)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full transition-colors" style={{ background: p.profit }} />
                    <span className="text-muted-foreground">Foyda:</span>
                    <span className="font-semibold transition-colors" style={{ color: p.profit }}>{formatCompact(totals.profit)}</span>
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
                            tickFormatter={formatCompact}
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
                            tickFormatter={formatCompact}
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                            width={55}
                            domain={[0, yMax]}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "hsl(var(--foreground))", opacity: 0.05 }}
                        />
                        <Bar yAxisId="left" dataKey="tushum" name="Tushum" fill={p.income} opacity={0.85} radius={[3, 3, 0, 0]} />
                        <Bar yAxisId="left" dataKey="xarajat" name="Xarajat" fill={p.expense} opacity={0.85} radius={[3, 3, 0, 0]} />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="foyda"
                            name="Foyda"
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
