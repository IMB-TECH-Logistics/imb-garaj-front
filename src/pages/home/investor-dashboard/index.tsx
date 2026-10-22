import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, TrendingDown } from "lucide-react"
import { ReactNode, useMemo, useState } from "react"
import { getMock, PERIOD_LISTS, PeriodKind } from "./mock"

type Currency = "UZS" | "USD"

const niceMax = (v: number) => {
    const step = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1))))
    const n = Math.ceil(v / step)
    const m = n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : n <= 8 ? 8 : 10
    return m * step
}

const PERIOD_KINDS: { key: PeriodKind; label: string }[] = [
    { key: "month", label: "Oy" },
    { key: "quarter", label: "Chorak" },
    { key: "year", label: "Yil" },
]

const NEG = "text-destructive"
const POS = "text-success"
const DEBT = "text-amber-700 dark:text-amber-400"

const parseRate = (s: string) => {
    const n = Number(s.replace(/\s/g, "").replace(",", "."))
    return Number.isFinite(n) && n > 0 ? n : 12000
}

const useFormat = (cur: Currency, rate: number) =>
    useMemo(() => {
        const fmt = (v: number) => {
            const x = cur === "USD" ? (v * 1000) / rate : v
            if (Math.abs(x) < 1e-9) return "–"
            const [i, d] = Math.abs(x).toFixed(1).split(".")
            return (x < 0 ? "-" : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "," + d
        }
        const pct = (v: number, dec = 1) =>
            Math.abs(v) < 1e-9 ? "–" : (v < 0 ? "-" : "") + Math.abs(v).toFixed(dec).replace(".", ",") + "%"
        return { fmt, pct, unit: cur === "USD" ? "ming $" : "mln so'm" }
    }, [cur, rate])

function Segmented<T extends string>({
    items,
    value,
    onChange,
}: {
    items: { key: T; label: string }[]
    value: T
    onChange: (v: T) => void
}) {
    return (
        <div className="flex rounded-md bg-muted p-[3px]">
            {items.map((it) => (
                <button
                    key={it.key}
                    type="button"
                    onClick={() => onChange(it.key)}
                    className={cn(
                        "min-h-9 rounded px-3.5 text-[13px]",
                        value === it.key ?
                            "bg-background font-semibold text-foreground shadow-sm"
                        :   "text-muted-foreground",
                    )}
                >
                    {it.label}
                </button>
            ))}
        </div>
    )
}

const SectionTitle = ({ children }: { children: ReactNode }) => (
    <div className="mt-2 flex items-center gap-3">
        <h2 className="whitespace-nowrap text-[13px] font-bold tracking-wider text-muted-foreground">
            {children}
        </h2>
        <div className="h-px flex-1 bg-border" />
    </div>
)

const CardHeader = ({ children, right }: { children: ReactNode; right?: ReactNode }) => (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-primary px-4 py-3 text-[13px] font-semibold tracking-wide text-primary-foreground">
        <span>{children}</span>
        {right && <span className="font-normal opacity-85">{right}</span>}
    </div>
)

const SubHeader = ({ children, right }: { children: ReactNode; right?: ReactNode }) => (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-primary/10 px-3.5 py-2.5 text-[13px] font-semibold text-primary">
        <span>{children}</span>
        {right}
    </div>
)

const th = "bg-muted/50 px-3 py-2 text-right text-[13px] font-semibold text-muted-foreground first:text-left"
const td = "border-b px-3 py-2 text-right text-[13px] tabular-nums whitespace-nowrap first:whitespace-normal first:text-left"

const valueClass = (v: number, opts?: { debt?: boolean; bold?: boolean }) =>
    cn(v < 0 && NEG, opts?.debt && v > 0 && DEBT, opts?.bold && "font-bold")

type BarChartProps = {
    labels: string[]
    series: { name: string; values: number[]; className: string }[]
    max: number
    min?: number
    height: number
    unit: string
    fmt: (v: number) => string
    gridValues: number[]
    footer?: ReactNode
}

function GroupedBarChart({ labels, series, max, min = 0, height, unit, fmt, gridValues, footer }: BarChartProps) {
    const zeroTop = min < 0 ? height * 0.9 : height
    const posScale = zeroTop / max
    const negScale = min < 0 ? (height - zeroTop) / -min : 0
    const yOf = (v: number) => (v >= 0 ? zeroTop - v * posScale : zeroTop - v * negScale)
    const last = labels.length - 1
    return (
        <div className="overflow-x-auto">
            <div className="flex min-w-[560px] gap-2 pt-2.5">
                <div className="relative w-[52px] shrink-0" style={{ height }}>
                    {gridValues.map((g) => (
                        <span
                            key={g}
                            className="absolute right-0 text-[11px] tabular-nums text-muted-foreground"
                            style={{ top: yOf(g) - 8 }}
                        >
                            {g === 0 ? "0" : fmt(g)}
                        </span>
                    ))}
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                    <div className="relative" style={{ height }}>
                        {gridValues.map((g) => (
                            <div
                                key={g}
                                className={cn(
                                    "absolute inset-x-0",
                                    g === 0 ? "border-t-[1.5px] border-muted-foreground/60" : "border-t border-dashed border-border",
                                )}
                                style={{ top: yOf(g) }}
                            />
                        ))}
                        <div className="absolute inset-0 grid grid-cols-12">
                            {labels.map((m, i) => (
                                <div
                                    key={m}
                                    className={cn("relative h-full rounded-t-md", i === last && "bg-primary/10")}
                                >
                                    {series.map((s, si) => {
                                        const v = s.values[i]
                                        const h = Math.max(Math.abs(v) * (v >= 0 ? posScale : negScale), 2)
                                        return (
                                            <div
                                                key={s.name}
                                                title={`${s.name} · ${m}: ${fmt(v)} ${unit}`}
                                                className={cn(
                                                    "absolute w-[36%] max-w-5",
                                                    v >= 0 ? "rounded-t" : "rounded-b opacity-75",
                                                    s.className,
                                                )}
                                                style={{
                                                    top: v >= 0 ? zeroTop - h : zeroTop,
                                                    height: h,
                                                    ...(si === 0 ?
                                                        { right: "calc(50% + 2px)" }
                                                    :   { left: "calc(50% + 2px)" }),
                                                }}
                                            />
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-12">
                        {labels.map((m, i) => (
                            <span
                                key={m}
                                className={cn(
                                    "whitespace-nowrap text-center text-[11px]",
                                    i === last ? "font-bold text-primary" : "text-muted-foreground",
                                )}
                            >
                                {m}
                            </span>
                        ))}
                    </div>
                    {footer}
                </div>
            </div>
        </div>
    )
}

const Legend = ({ items }: { items: { label: string; className: string }[] }) => (
    <span className="flex flex-wrap gap-4">
        {items.map((it) => (
            <span key={it.label} className="flex items-center gap-1.5">
                <span className={cn("inline-block h-3 w-3 rounded-[3px]", it.className)} />
                {it.label}
            </span>
        ))}
    </span>
)

const SERIES_BG: Record<string, string> = {
    "chart-1": "bg-primary",
    "chart-3": "bg-[hsl(var(--chart-3))]",
    "chart-5": "bg-[hsl(var(--chart-5))]",
}
const SERIES_TEXT: Record<string, string> = {
    "chart-1": "text-primary",
    "chart-3": "text-[hsl(var(--chart-3))]",
}

export default function InvestorDashboard() {
    const [cur, setCur] = useState<Currency>("UZS")
    const [rateText, setRateText] = useState("12 000,00")
    const [kind, setKind] = useState<PeriodKind>("month")
    const [offset, setOffset] = useState(0)
    const [invIdx, setInvIdx] = useState(0)
    const [onlyActive, setOnlyActive] = useState(false)

    const { fmt, pct, unit } = useFormat(cur, parseRate(rateText))

    const pList = PERIOD_LISTS[kind]
    const pOff = Math.min(offset, pList.length - 1)
    const periodLabel = pList[pList.length - 1 - pOff]
    const mock = useMemo(() => getMock(kind, periodLabel), [kind, periodLabel])
    const {
        money: MONEY,
        ops: OPS,
        months: MONTHS,
        coRev: CO_REV,
        coCost: CO_COST,
        costTotal: COST_TOTAL,
        pnl: PNL,
        balance: BALANCE,
        investors: INVESTORS,
        summary: SUMMARY,
        workingCapital: WORKING_CAPITAL,
        profitShare: PROFIT_SHARE,
        journalMonths: JOURNAL_MONTHS,
    } = mock
    const cash = MONEY.find((m) => m.key === "cash")?.value ?? 0
    const debt = BALANCE.find((r) => r.kind === "debt")?.value ?? 0

    const inv = INVESTORS[Math.min(invIdx, INVESTORS.length - 1)]
    const endCap = inv.fleet + WORKING_CAPITAL + PROFIT_SHARE
    const invested = inv.fleet + WORKING_CAPITAL
    const roi = ((inv.lease + PROFIT_SHARE) / endCap) * 100

    const journal = useMemo(() => {
        let running = 0
        const sums = [0, 0, 0, 0]
        const src = mock.journal[inv.name] ?? []
        const rows = JOURNAL_MONTHS.map((m, i) => {
            const vals = src[i] ?? [0, 0, 0, 0]
            const start = running
            running = start + vals[0] + vals[1] - vals[2] - vals[3]
            vals.forEach((v, k) => (sums[k] += v))
            return { m, start, vals, end: running, active: vals.some((v) => v !== 0) }
        })
        return { rows, sums, running }
    }, [inv, mock, JOURNAL_MONTHS])
    const back = journal.sums[0] + journal.sums[1]
    const pbPct = (back / invested) * 100
    const monthsLeft = Math.max(Math.ceil((invested - back) / Math.max(inv.lease, 1e-9)), 0)
    const journalRows = journal.rows.filter((r) => !onlyActive || r.active).reverse()

    const delta = (now: number, prev: number, upIsGood: boolean, abs?: boolean) => {
        const d = abs ? now - prev : (now / prev - 1) * 100
        const good = upIsGood ? d >= 0 : d <= 0
        return {
            text: (d >= 0 ? "▲ " : "▼ ") + (abs ? fmt(Math.abs(d)) : pct(Math.abs(d))) + ` ${mock.prevLabel} nisbatan`,
            className: good ? POS : NEG,
        }
    }

    const coMax = niceMax(Math.max(...CO_REV, ...CO_COST))
    const coGrid = [coMax, coMax * 0.75, coMax * 0.5, coMax * 0.25, 0]
    const trendAll = INVESTORS.flatMap((i) => i.trend)
    const trMax = niceMax(Math.max(...trendAll, 1))
    const trMin = Math.min(...trendAll, 0) < 0 ? -niceMax(-Math.min(...trendAll)) : 0
    const trGrid = trMin < 0 ? [trMax, trMax / 2, 0, trMin] : [trMax, trMax * 0.75, trMax / 2, trMax / 4, 0]

    return (
        <div className="flex flex-col gap-5 pb-12">
            <h1 className="text-[22px] font-bold">Investorlar dashboardi</h1>

            <section className="flex flex-wrap items-end gap-3 rounded-lg border bg-card px-4 py-3.5">
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">Davr</span>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <Segmented
                            items={PERIOD_KINDS}
                            value={kind}
                            onChange={(k) => {
                                setKind(k)
                                setOffset(0)
                            }}
                        />
                        <div className="flex items-center gap-0.5 rounded-md border bg-background p-0.5">
                            <button
                                type="button"
                                aria-label="Oldingi davr"
                                disabled={pOff >= pList.length - 1}
                                onClick={() => setOffset(pOff + 1)}
                                className="flex h-9 w-9 items-center justify-center rounded disabled:opacity-35"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span aria-live="polite" className="min-w-[132px] text-center text-sm font-semibold">
                                {periodLabel}
                            </span>
                            <button
                                type="button"
                                aria-label="Keyingi davr"
                                disabled={pOff <= 0}
                                onClick={() => setOffset(pOff - 1)}
                                className="flex h-9 w-9 items-center justify-center rounded disabled:opacity-35"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex-1" />
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">Valyuta</span>
                    <Segmented
                        items={[
                            { key: "UZS" as Currency, label: "UZS" },
                            { key: "USD" as Currency, label: "USD" },
                        ]}
                        value={cur}
                        onChange={setCur}
                    />
                </div>
                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    USD kursi, so'm
                    <input
                        value={rateText}
                        onChange={(e) => setRateText(e.target.value)}
                        className="h-10 w-[120px] rounded-md border bg-background px-2.5 text-right text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    />
                </label>
                <div className="flex min-h-10 items-center rounded-md bg-muted px-3 text-[13px]">
                    Barcha summalar:&nbsp;<b>{unit}</b>
                </div>
            </section>

            <section className="flex items-start gap-3.5 rounded-lg border bg-card px-4 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <TrendingDown size={18} />
                </div>
                <div className="flex flex-col gap-1 text-sm leading-relaxed">
                    <div className="text-[15px] font-bold">{mock.banner.title}</div>
                    <div className="text-muted-foreground">
                        {mock.banner.text} Investorlarga hali to'lanmagan qarz:{" "}
                        <b className="text-foreground">
                            {fmt(debt)} {unit}
                        </b>
                        .
                    </div>
                </div>
            </section>

            <SectionTitle>1 · UMUMIY NATIJA</SectionTitle>

            <section className="flex flex-col gap-2.5">
                <div className="flex flex-wrap gap-3">
                    {MONEY.map((k) => {
                        const d = delta(k.value, k.prev, k.upIsGood, k.absDelta)
                        return (
                            <div key={k.key} className="flex flex-[1_1_200px] flex-col gap-1.5 rounded-lg border bg-card px-4 py-4">
                                <span className="text-[13px] text-muted-foreground">{k.label}</span>
                                <span className={cn("text-[28px] font-bold leading-tight tabular-nums", k.value < 0 && NEG)}>
                                    {fmt(k.value)}
                                </span>
                                <span className={cn("text-xs font-medium", d.className)}>{d.text}</span>
                            </div>
                        )
                    })}
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border bg-card px-4 py-2.5 text-[13px] text-muted-foreground">
                    {OPS.map((o) => (
                        <span key={o.label}>
                            {o.label}{" "}
                            <b className={cn("text-foreground", o.money !== undefined && o.money < 0 && NEG)}>
                                {o.money !== undefined ? fmt(o.money) : o.value}
                            </b>
                        </span>
                    ))}
                    <span className="flex-1" />
                    <span className="text-xs">▲▼ — {mock.prevLabel} nisbatan (namuna ma'lumot)</span>
                </div>
            </section>

            <figure className="m-0 overflow-hidden rounded-lg border bg-card">
                <CardHeader right="namuna ma'lumot">TUSHUM, XARAJAT VA SOF FOYDA — 12 OY</CardHeader>
                <div className="flex flex-col gap-3.5 px-5 py-4">
                    <GroupedBarChart
                        labels={MONTHS}
                        series={[
                            { name: "Tushum", values: CO_REV, className: "bg-primary" },
                            { name: "Xarajat", values: CO_COST, className: "bg-[hsl(var(--chart-1))]" },
                        ]}
                        max={coMax}
                        height={220}
                        unit={unit}
                        fmt={fmt}
                        gridValues={coGrid}
                        footer={
                            <div className="grid grid-cols-12 border-t border-dashed pt-1.5">
                                {MONTHS.map((m, i) => {
                                    const net = CO_REV[i] - CO_COST[i]
                                    return (
                                        <span
                                            key={m}
                                            className={cn("text-center text-[11px] font-semibold tabular-nums", net < 0 ? NEG : POS)}
                                        >
                                            {(net > 0 ? "+" : "") + fmt(net)}
                                        </span>
                                    )
                                })}
                            </div>
                        }
                    />
                    <div className="flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
                        <span className="flex flex-wrap gap-4">
                            <Legend
                                items={[
                                    { label: "Tushum", className: "bg-primary" },
                                    { label: "Xarajat", className: "bg-[hsl(var(--chart-1))]" },
                                ]}
                            />
                            <span>Pastdagi raqamlar — sof foyda (yashil foyda, qizil zarar)</span>
                        </span>
                        <span>Ustun ustiga sichqoncha olib boring — aniq summa chiqadi</span>
                    </div>
                </div>
            </figure>

            <SectionTitle>2 · FOYDA-ZARAR VA BALANS</SectionTitle>

            <section className="flex flex-wrap items-stretch gap-4">
                <div className="min-w-0 flex-[3_1_460px] overflow-hidden rounded-lg border bg-card">
                    <CardHeader>FOYDA VA ZARAR</CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className={th}>Ko'rsatkich</th>
                                    <th className={th}>Xarajatdagi ulushi</th>
                                    <th className={th}>Summa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {PNL.map((r) => {
                                    const empty = Math.abs(r.value) < 1e-9
                                    const p = (r.value / COST_TOTAL) * 100
                                    return (
                                        <tr
                                            key={r.label}
                                            className={cn(
                                                r.kind === "total" && "bg-muted/60 font-semibold",
                                                r.kind === "result" && (r.value < 0 ? "bg-destructive/10 font-semibold" : "bg-success/10 font-semibold"),
                                                empty && "opacity-45",
                                            )}
                                        >
                                            <td className={cn(td, !r.kind && "pl-7 text-muted-foreground")}>{r.label}</td>
                                            <td className={td}>
                                                {r.share && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="inline-block h-2 w-[120px] overflow-hidden rounded-full bg-muted">
                                                            <span
                                                                className={cn("block h-full rounded-full", SERIES_BG[r.share])}
                                                                style={{ width: `${p.toFixed(1)}%` }}
                                                            />
                                                        </span>
                                                        <span className="min-w-[34px] font-semibold">{Math.round(p)}%</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className={cn(td, valueClass(r.value, { bold: r.kind === "result" }))}>
                                                {r.kind === "pct" ? pct(r.value) : fmt(r.value)}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex min-w-0 flex-[2_1_320px] flex-col overflow-hidden rounded-lg border bg-card">
                    <CardHeader>BALANS — DAVR OXIRIGA</CardHeader>
                    <table className="w-full border-collapse">
                        <tbody>
                            {BALANCE.map((r) => (
                                <tr
                                    key={r.label}
                                    className={cn(
                                        r.kind === "total" && "bg-muted/60 font-semibold",
                                        r.kind === "good" && "bg-success/10 font-semibold",
                                        Math.abs(r.value) < 1e-9 && "opacity-45",
                                    )}
                                >
                                    <td className={td}>{r.label}</td>
                                    <td className={cn(td, valueClass(r.value, { debt: r.kind === "debt" }))}>{fmt(r.value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="mt-auto px-4 py-3 text-xs leading-normal text-muted-foreground">
                        Aylanma mablag' — kassadagi pul minus to'lanishi kerak bo'lgan qarzlar ({fmt(cash)} − {fmt(debt)} ={" "}
                        {fmt(cash - debt)}). Shu summa bilan kundalik xarajatlar qoplanadi.
                    </p>
                </div>
            </section>

            <SectionTitle>3 · INVESTORLAR</SectionTitle>

            <section className="flex flex-wrap items-stretch gap-4">
                <div className="min-w-0 flex-[2_1_420px] overflow-hidden rounded-lg border bg-card">
                    <CardHeader>INVESTORLAR BO'YICHA XULOSA</CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className={th}>Ko'rsatkich</th>
                                    {INVESTORS.map((i) => (
                                        <th key={i.name} className={cn(th, SERIES_TEXT[i.color])}>
                                            {i.name}
                                        </th>
                                    ))}
                                    <th className={th}>Jami</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SUMMARY.map((r) => {
                                    const show = (v: number) =>
                                        r.kind === "pct" ? pct(v, 0) : fmt(v)
                                    const isTotal = r.kind === "total"
                                    return (
                                        <tr key={r.label} className={cn(isTotal && "bg-muted/60 font-semibold")}>
                                            <td className={td}>{r.label}</td>
                                            {r.values.map((v, i) => (
                                                <td key={i} className={cn(td, valueClass(v, { debt: r.kind === "debt", bold: isTotal }))}>
                                                    {show(v)}
                                                </td>
                                            ))}
                                            <td className={cn(td, valueClass(r.total, { debt: r.kind === "debt", bold: r.kind !== "pct" }))}>
                                                {show(r.total)}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <figure className="m-0 flex min-w-0 flex-[3_1_520px] flex-col overflow-hidden rounded-lg border bg-card">
                    <CardHeader right="namuna ma'lumot">INVESTORLAR SOF FOYDASI — 12 OY</CardHeader>
                    <div className="flex flex-1 flex-col justify-between gap-3 px-4 py-3.5">
                        <GroupedBarChart
                            labels={MONTHS}
                            series={INVESTORS.map((i) => ({ name: i.name, values: i.trend, className: SERIES_BG[i.color] }))}
                            max={trMax}
                            min={trMin}
                            height={200}
                            unit={unit}
                            fmt={fmt}
                            gridValues={trGrid}
                        />
                        <div className="text-xs text-muted-foreground">
                            <Legend items={INVESTORS.map((i) => ({ label: i.name, className: SERIES_BG[i.color] }))} />
                        </div>
                    </div>
                </figure>
            </section>

            <section className="overflow-hidden rounded-lg border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-primary px-4 py-3 text-primary-foreground">
                    <div className="flex flex-wrap items-baseline gap-3">
                        <span className="text-base font-bold">{inv.name}</span>
                        <span className="text-[13px] opacity-90">
                            Investor {inv.idx} / {INVESTORS.length} · ulush 50%
                        </span>
                    </div>
                    <div role="tablist" aria-label="Investor tanlash" className="flex gap-1 rounded-md bg-white/20 p-[3px]">
                        {INVESTORS.map((i, idx) => (
                            <button
                                key={i.name}
                                type="button"
                                role="tab"
                                aria-selected={idx === invIdx}
                                onClick={() => setInvIdx(idx)}
                                className={cn(
                                    "min-h-9 rounded px-4 text-[13px]",
                                    idx === invIdx ? "bg-background font-bold text-primary" : "text-primary-foreground",
                                )}
                            >
                                {i.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 px-4 pt-4">
                    {[
                        { label: "Investor kapitali", value: fmt(endCap), sub: "davr oxiri", className: "" },
                        {
                            label: "Sarmoya daromadliligi",
                            value: (roi < 0 ? "-" : "+") + Math.abs(roi).toFixed(1).replace(".", ",") + "%",
                            sub: "bu oy · ijara + foyda ulushi",
                            className: roi < 0 ? NEG : POS,
                        },
                        { label: "Bu oy natijasi", value: fmt(PROFIT_SHARE), sub: "zarar ulushi", className: NEG },
                        {
                            label: "To'lanmagan qarz",
                            value: fmt(journal.running),
                            sub: "investorga to'lanishi kerak",
                            className: journal.running > 0 ? DEBT : POS,
                        },
                    ].map((s) => (
                        <div key={s.label} className="flex flex-[1_1_170px] flex-col gap-1 rounded-md border px-3.5 py-3">
                            <span className="text-xs text-muted-foreground">{s.label}</span>
                            <span className={cn("text-[22px] font-bold tabular-nums", s.className)}>{s.value}</span>
                            <span className="text-xs text-muted-foreground">{s.sub}</span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap items-stretch gap-4 p-4">
                    <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
                        <div className="overflow-hidden rounded-md border">
                            <SubHeader>INVESTOR KAPITALI</SubHeader>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className={th}>Ko'rsatkich</th>
                                            <th className={th}>Davr boshi</th>
                                            <th className={th}>O'zgarish</th>
                                            <th className={th}>Davr oxiri</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { label: "Avtoparkka investitsiya", v: inv.fleet },
                                            { label: "Aylanma kapital", v: WORKING_CAPITAL },
                                            { label: "Foyda (zarar) ulushi", share: "· 50%", v: PROFIT_SHARE },
                                            { label: "Jami kapital", v: endCap, total: true },
                                        ].map((r) => (
                                            <tr key={r.label} className={cn(r.total && "bg-muted/60 font-semibold")}>
                                                <td className={td}>
                                                    {r.label} {r.share && <span className="font-normal text-muted-foreground">{r.share}</span>}
                                                </td>
                                                <td className={td}>{fmt(0)}</td>
                                                <td className={cn(td, valueClass(r.v, { bold: r.total }))}>{fmt(r.v)}</td>
                                                <td className={cn(td, valueClass(r.v, { bold: r.total }))}>{fmt(r.v)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="px-3.5 py-2.5 text-xs leading-normal text-muted-foreground">
                                O'zgarish — shu davrda kiritilgan sarmoya va investorga tegishli foyda (zarar) ulushi.
                            </p>
                        </div>

                        <div className="flex flex-1 flex-col overflow-hidden rounded-md border">
                            <SubHeader right={<span className="font-normal text-muted-foreground">taxminiy</span>}>
                                SARMOYA QACHON QAYTADI
                            </SubHeader>
                            <div className="flex flex-1 flex-col justify-between gap-3 p-3.5">
                                <div className="flex flex-wrap items-baseline justify-between gap-3">
                                    <span className="text-[13px] text-muted-foreground">
                                        Qaytdi <b className="text-foreground">{fmt(back)}</b> / {fmt(invested)}
                                    </span>
                                    <span className="text-xl font-bold tabular-nums text-primary">
                                        {pbPct.toFixed(1).replace(".", ",")}%
                                    </span>
                                </div>
                                <div
                                    role="progressbar"
                                    aria-label="Sarmoya qaytishi"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={Number(pbPct.toFixed(1))}
                                    className="h-2.5 overflow-hidden rounded-full bg-muted"
                                >
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(pbPct, 1).toFixed(1)}%` }} />
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex flex-[1_1_140px] flex-col gap-0.5 rounded-md bg-muted/60 px-3 py-2.5">
                                        <span className="text-xs text-muted-foreground">Oylik qaytish sur'ati</span>
                                        <span className="text-base font-bold tabular-nums">{fmt(inv.lease)} / oy</span>
                                    </div>
                                    <div className="flex flex-[1_1_140px] flex-col gap-0.5 rounded-md bg-muted/60 px-3 py-2.5">
                                        <span className="text-xs text-muted-foreground">Qolgan muddat</span>
                                        <span className="text-base font-bold">
                                            ~{Math.floor(monthsLeft / 12)} yil {monthsLeft % 12} oy
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs leading-normal text-muted-foreground">
                                    Qaytgan summa — investorga hisoblangan ijara va foyda. Muddat hozirgi oy sur'ati saqlansa
                                    deb hisoblangan.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="min-w-0 flex-[2_1_560px] overflow-hidden rounded-md border">
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-primary/10 py-1.5 pl-3.5 pr-2 text-[13px] font-semibold text-primary">
                            <span>
                                DIVIDEND VA IJARA JURNALI <span className="font-normal text-muted-foreground">· 12 oy</span>
                            </span>
                            <button
                                type="button"
                                aria-pressed={onlyActive}
                                onClick={() => setOnlyActive(!onlyActive)}
                                className={cn(
                                    "flex min-h-9 items-center gap-2 rounded border bg-background px-3 text-xs font-medium",
                                    onlyActive ? "border-primary text-primary" : "text-muted-foreground",
                                )}
                            >
                                <span
                                    className={cn(
                                        "inline-block h-3.5 w-3.5 rounded border-[1.5px]",
                                        onlyActive ? "border-primary bg-primary ring-2 ring-inset ring-background" : "border-muted-foreground/60",
                                    )}
                                />
                                Faqat harakatli oylar
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] table-fixed border-collapse">
                                <colgroup>
                                    <col className="w-[14%]" />
                                    <col className="w-[13%]" />
                                    <col className="w-[10%]" />
                                    <col className="w-[10%]" />
                                    <col className="w-[10%]" />
                                    <col className="w-[10%]" />
                                    <col className="w-[15%]" />
                                    <col className="w-[18%]" />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th rowSpan={2} className={th}>Oy</th>
                                        <th rowSpan={2} className={th}>Boshlang'ich qoldiq</th>
                                        <th colSpan={2} className={cn(th, "bg-primary/15 text-center text-primary")}>Hisoblandi</th>
                                        <th colSpan={2} className={cn(th, "bg-success/15 text-center text-success")}>To'landi</th>
                                        <th rowSpan={2} className={th}>Yakuniy qoldiq</th>
                                        <th rowSpan={2} className={cn(th, "text-center")}>Holat</th>
                                    </tr>
                                    <tr>
                                        <th className={cn(th, "bg-primary/5")}>Ijara</th>
                                        <th className={cn(th, "bg-primary/5")}>Foyda</th>
                                        <th className={cn(th, "bg-success/5")}>Ijara</th>
                                        <th className={cn(th, "bg-success/5")}>Foyda</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        ...journalRows,
                                        {
                                            m: "Jami 12 oy",
                                            start: 0,
                                            vals: journal.sums,
                                            end: journal.running,
                                            active: true,
                                            total: true,
                                        },
                                    ].map((r) => {
                                        const isTotal = "total" in r
                                        return (
                                            <tr
                                                key={r.m}
                                                className={cn(
                                                    isTotal ? "bg-muted/60 font-semibold" : r.active ? "font-medium" : "opacity-45",
                                                )}
                                            >
                                                <td className={td}>{r.m}</td>
                                                <td className={td}>{fmt(r.start)}</td>
                                                {r.vals.map((v, k) => (
                                                    <td key={k} className={cn(td, k < 2 ? "bg-primary/5" : "bg-success/5", isTotal && "font-bold")}>
                                                        {fmt(v)}
                                                    </td>
                                                ))}
                                                <td className={cn(td, valueClass(r.end, { bold: r.active }))}>{fmt(r.end)}</td>
                                                <td className={cn(td, "text-center")}>
                                                    {r.end > 0 ?
                                                        <span className="inline-block rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                                            To'lanmagan
                                                        </span>
                                                    : r.active ?
                                                        <span className="inline-block rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                                                            To'langan
                                                        </span>
                                                    :   null}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 px-3.5 py-2.5 text-xs leading-normal text-muted-foreground">
                            <span>
                                <b className="text-primary">Hisoblandi</b> — investorga yozilgan summa
                            </span>
                            <span>
                                <b className="text-success">To'landi</b> — kassadan berilgan summa
                            </span>
                            <span>
                                <b className="text-foreground">Yakuniy qoldiq</b> — hali to'lanmagan qarz
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
