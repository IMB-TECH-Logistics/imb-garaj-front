import { useMemo } from "react"
import {
    Area,
    AreaChart,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    ReferenceLine,
    ReferenceArea,
} from "recharts"

const MONTHS = ["Apr", "May", "Iyn", "Iyl", "Avg", "Sen"]

function generateForecast() {
    let balance = 15_780_000
    return MONTHS.map((month) => {
        const income = Math.round((Math.random() * 30 + 20) * 1_000_000)
        const expense = Math.round((Math.random() * 25 + 15) * 1_000_000)
        balance = balance + income - expense
        return { month, income, expense, balance, net: income - expense }
    })
}

const fmt = (v: number) => {
    const abs = Math.abs(v)
    if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M"
    if (abs >= 1_000) return (v / 1_000).toFixed(0) + "K"
    return String(v)
}

const fmtFull = (v: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(v)) + " so'm"

function ForecastTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-popover/95 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-xl text-xs space-y-1">
            <p className="font-semibold text-foreground">{label} 2026</p>
            {payload.map((entry: any) => (
                <div key={entry.dataKey} className="flex items-center gap-2">
                    <span className="size-2 rounded-full shrink-0" style={{ background: entry.stroke || entry.color }} />
                    <span className="text-muted-foreground">{entry.name}:</span>
                    <span className="font-medium text-foreground">{fmtFull(entry.value)}</span>
                </div>
            ))}
        </div>
    )
}

export default function CashflowForecast() {
    const data = useMemo(() => generateForecast(), [])

    const minBalance = Math.min(...data.map((d) => d.balance))
    const hasCashGap = minBalance < 5_000_000

    const cashGapMonths = data.filter((d) => d.balance < 5_000_000)

    return (
        <div className="bg-card border rounded-xl overflow-hidden h-full flex flex-col">
            <div className="px-4 pt-3 pb-2 shrink-0 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold">Cash Flow Prognoz</h3>
                    <p className="text-[10px] text-muted-foreground">Kelgusi 6 oy</p>
                </div>
                {hasCashGap && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">
                        Cash gap xavfi
                    </span>
                )}
            </div>
            <div className="flex-1 min-h-0 px-2 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="forecastIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#26a69a" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="#26a69a" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="forecastExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef5350" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="#ef5350" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="forecastBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            fontSize={10}
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            fontSize={9}
                            tickFormatter={fmt}
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                            width={50}
                        />
                        <Tooltip content={<ForecastTooltip />} />
                        {/* Cash gap danger zone */}
                        <ReferenceLine
                            y={5_000_000}
                            stroke="#f59e0b"
                            strokeDasharray="4 4"
                            strokeWidth={1}
                            label={{ value: "Min balans", position: "right", fontSize: 9, fill: "#f59e0b" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="income"
                            name="Tushum"
                            stroke="#26a69a"
                            strokeWidth={2}
                            fill="url(#forecastIncome)"
                            dot={{ r: 3, fill: "#26a69a", stroke: "#26a69a", strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="expense"
                            name="Xarajat"
                            stroke="#ef5350"
                            strokeWidth={2}
                            fill="url(#forecastExpense)"
                            dot={{ r: 3, fill: "#ef5350", stroke: "#ef5350", strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="balance"
                            name="Balans"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            fill="url(#forecastBalance)"
                            dot={{ r: 3, fill: "#3b82f6", stroke: "#3b82f6", strokeWidth: 1 }}
                            strokeDasharray="6 3"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
