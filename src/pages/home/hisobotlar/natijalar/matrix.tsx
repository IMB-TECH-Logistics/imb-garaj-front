// Variant C — oylar ustunlarda (umumiy ko'rinish) + qatorlar oylik hisobot tuzilishida (batafsil ochiladi).
import { Card, CardContent } from "@/components/ui/card"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { amountText, num } from "@/pages/home/kontragent/api"
import { MONTHLY_REPORTS, MonthlyReport } from "@/pages/home/moliyaviy-hisobot/api"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { ChevronDown, SquareArrowOutUpRight } from "lucide-react"
import { Fragment, ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

type Line = {
    key: string
    label: string
    get: (r: MonthlyReport) => number
    kind?: "head" | "total" | "indent"
    expense?: boolean
    margin?: boolean
    hint?: string
    hide?: (rs: MonthlyReport[]) => boolean
    children?: Line[]
}

const Amt = ({ v, strong, muted }: { v: number; strong?: boolean; muted?: boolean }) => (
    <span className={cn("tabular-nums whitespace-nowrap", strong && "font-semibold", muted && "text-muted-foreground", v < 0 && "text-destructive")}>
        {v < 0 ? "−" : ""}
        {amountText(Math.abs(v))}
    </span>
)

const Delta = ({ cur, prev, expense }: { cur: number; prev: number | undefined; expense?: boolean }) => {
    if (prev === undefined || prev === 0) return null
    const a = expense ? Math.abs(cur) : cur
    const b = expense ? Math.abs(prev) : prev
    const p = ((a - b) / Math.abs(b)) * 100
    if (Math.abs(p) < 0.05) return null
    const good = expense ? p < 0 : p > 0
    return (
        <div className={cn("text-[11px] tabular-nums", good ? "text-green-600 dark:text-green-500" : "text-destructive")}>
            {p > 0 ? "▲" : "▼"} {Math.abs(p).toFixed(0)}%
        </div>
    )
}

const PERIODS = [
    { v: 3, l: "3 oy" },
    { v: 6, l: "6 oy" },
    { v: 12, l: "12 oy" },
    { v: 24, l: "24 oy" },
    { v: 0, l: "Hammasi" },
]

type Col = MonthlyReport & { _n?: number; _dist?: Record<string, number> }

// Sof foyda taqsimoti — hisobot ichidagi «Sof foyda taqsimoti» bilan bir xil (backend saqlagan qiymatlar)
const distOf = (r: MonthlyReport): Record<string, number> => {
    const d: Record<string, number> = { firm: num(r.firm_amount), investors: num(r.dividends) }
    ;(r.owners ?? []).forEach((o) => {
        if (num(o.dividend)) d[`inv_${o.kontragent}`] = num(o.dividend)
    })
    return d
}

const NUM_FIELDS = [
    "income", "trip_expense", "trip_fuel", "trip_salary", "trip_other", "other_expense",
    "company_vehicle_expense", "other", "profit", "tax_total", "tax_profit", "tax_vat",
    "tax_payroll", "tax_cash", "tax", "management_total", "rent_total", "leasing_total", "net",
] as const

// Oylarni chorak/yil bo'yicha jamlash
const groupCols = (rows: Col[], g: "m" | "q" | "y"): Col[] => {
    if (g === "m") return rows
    const map = new Map<string, Col[]>()
    rows.forEach((r) => {
        const y = r.month.slice(0, 4)
        const m = Number(r.month.slice(5, 7))
        const key = g === "y" ? y : `${y}-Q${Math.ceil(m / 3)}`
        map.set(key, [...(map.get(key) ?? []), r])
    })
    return [...map.entries()].map(([key, items], i) => {
        const sum: Record<string, string> = {}
        NUM_FIELDS.forEach((f) => (sum[f] = String(items.reduce((a, r) => a + num(r[f] as string), 0))))
        const dist: Record<string, number> = {}
        items.forEach((r) =>
            Object.entries(r._dist ?? {}).forEach(([k, v]) => (dist[k] = (dist[k] ?? 0) + v)),
        )
        const label = g === "y" ? `${key} yil` : `${key.slice(0, 4)} · ${key.slice(-1)}-chorak`
        return {
            ...sum,
            id: -(i + 1),
            month: items[0].month,
            month_label: label,
            status: items.every((r) => r.status === "approved") ? "approved" : "draft",
            _n: items.length,
            _dist: dist,
        } as unknown as Col
    })
}

export function PnlMatrix({ onOpen, actions }: { onOpen: (id: number) => void; actions?: ReactNode }) {
    const { t } = useTranslation()
    const { data: list = [], isLoading } = useGet<MonthlyReport[]>(MONTHLY_REPORTS)
    // ko'rinish tanlovlari URL'da — «orqaga» bosilganda tiklanadi
    const search = useSearch({ from: "/_main" }) as Record<string, string | undefined>
    const navigate = useNavigate()
    const setParam = (k: string, v: string | undefined) =>
        navigate({ search: { ...search, [k]: v } as any, replace: true })
    const period = search.fin_p !== undefined ? Number(search.fin_p) : 6
    const setPeriod = (v: number) => setParam("fin_p", String(v))
    const [showDelta, setShowDelta] = useState(true)
    const group = (["m", "q", "y"].includes(search.fin_g ?? "") ? search.fin_g : "m") as "m" | "q" | "y"
    const setGroup = (v: "m" | "q" | "y") => setParam("fin_g", v === "m" ? undefined : v)
    const [open, setOpen] = useState<Record<string, boolean>>({})

    // eski → yangi (chapdan o'ngga), oxirida «Jami»
    const months = useMemo(() => {
        const src: Col[] = list.map((r) => ({ ...r, _dist: distOf(r) }))
        const s = [...src].sort((a, b) => a.month.localeCompare(b.month))
        return groupCols(period ? s.slice(-period) : s, group)
    }, [list, period, group])
    const monthCount = months.reduce((a, r) => a + (r._n ?? 1), 0)
    // ochilganda eng yangi oylar ko'rinsin (o'ngga surish)
    const scrollRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const el = scrollRef.current
        if (el) el.scrollLeft = el.scrollWidth
    }, [months])

    const investors = useMemo(() => {
        const names = new Map<number, string>()
        list.forEach((r) => {
            ;(r.owners ?? []).forEach((o) => num(o.dividend) && names.set(o.kontragent, o.name))
            ;(r.shares ?? []).forEach((sh) => !names.has(sh.kontragent) && names.set(sh.kontragent, sh.name))
        })
        return [...names.entries()]
    }, [list])
    const dist = (k: string) => (r: MonthlyReport) => (r as Col)._dist?.[k] ?? 0

    const neg = (f: (r: MonthlyReport) => number) => (r: MonthlyReport) => -f(r)
    const lines: Line[] = [
        { key: "income", label: t("fin_report.lines.income"), get: (r) => num(r.income) },
        {
            key: "trip",
            label: t("fin_report.lines.trip_expense"),
            get: neg((r) => num(r.trip_expense)),
            expense: true,
            children: [
                { key: "fuel", label: t("fin_report.lines.trip_fuel"), get: neg((r) => num(r.trip_fuel)), expense: true },
                { key: "salary", label: t("fin_report.lines.trip_salary"), get: neg((r) => num(r.trip_salary)), expense: true },
                { key: "trip_other", label: t("fin_report.lines.trip_other"), get: neg((r) => num(r.trip_other)), expense: true },
            ],
        },
        {
            key: "other",
            label: t("fin_report.lines.other_expense"),
            get: neg((r) => num(r.other_expense)),
            expense: true,
            children: [
                { key: "cve", label: t("fin_report.lines.company_vehicle_expense"), get: neg((r) => num(r.company_vehicle_expense)), expense: true },
                { key: "ok", label: t("fin_report.lines.other_kassa"), get: neg((r) => num(r.other)), expense: true },
            ],
        },
        { key: "profit", label: t("fin_report.lines.profit"), get: (r) => num(r.profit), kind: "head", margin: true },
        {
            key: "tax",
            label: t("fin_report.lines.tax"),
            get: neg((r) => num(r.tax_total)),
            kind: "indent",
            expense: true,
            children: [
                ...(["tax_profit", "tax_vat", "tax_payroll", "tax_cash"] as const).map((k) => ({
                    key: k,
                    label: t(`fin_report.lines.${k}`),
                    get: neg((r: MonthlyReport) => num(r[k])),
                    expense: true,
                })),
                { key: "tax_o", label: t("fin_report.lines.tax_other"), get: neg((r) => num(r.tax)), expense: true, hide: (rs) => rs.every((r) => !num(r.tax)) },
            ],
        },
        { key: "mgmt", label: t("fin_report.lines.management"), get: neg((r) => num(r.management_total)), kind: "indent", expense: true },
        { key: "rent", label: t("fin_report.lines.rent"), get: neg((r) => num(r.rent_total)), kind: "indent", expense: true },
        {
            key: "leasing",
            label: t("fin_report.lines.leasing"),
            get: neg((r) => num(r.leasing_total)),
            kind: "indent",
            expense: true,
            hide: (rs) => rs.every((r) => !num(r.leasing_total)),
        },
        { key: "net", label: t("fin_report.lines.net"), get: (r) => num(r.net), kind: "total", margin: true },
        { key: "d_firm", label: t("fin_report.dist.firm"), get: dist("firm"), kind: "indent" },
        {
            key: "d_inv",
            label: t("fin_report.dist.investors"),
            get: dist("investors"),
            kind: "indent",
            hide: (rs) => rs.every((r) => !dist("investors")(r)) && !investors.length,
            children: investors.map(([id, name]) => ({
                key: `d_inv_${id}`,
                label: name,
                get: dist(`inv_${id}`),
                hide: (rs: MonthlyReport[]) => rs.every((r) => !dist(`inv_${id}`)(r)),
            })),
        },
    ]

    if (isLoading) return <p className="text-sm text-muted-foreground">{t("fin_report.loading")}</p>
    if (!list.length) return <p className="text-sm text-muted-foreground">Hali oylik hisobot yo'q.</p>

    const sum = (f: (r: MonthlyReport) => number) => months.reduce((a, r) => a + f(r), 0)
    const totIncome = sum((r) => num(r.income))
    const totProfit = sum((r) => num(r.profit))
    const totNet = sum((r) => num(r.net))
    const marja = (v: number, inc: number) => (inc ? `${((v / inc) * 100).toFixed(1)}%` : "—")

    const renderLine = (l: Line, depth: number): ReactNode => {
        if (l.hide?.(months)) return null
        const strong = l.kind === "head" || l.kind === "total"
        const canOpen = !!l.children?.length
        const isOpen = !!open[l.key]
        const total = sum(l.get)
        return (
            <Fragment key={l.key}>
                <tr
                    onClick={canOpen ? () => setOpen((o) => ({ ...o, [l.key]: !o[l.key] })) : undefined}
                    className={cn("border-b", depth > 0 && "bg-muted/10 text-xs", strong && "bg-muted", canOpen && "cursor-pointer hover:bg-muted/30")}
                >
                    <td
                        className={cn(
                            "sticky left-0 z-10 bg-card px-4 whitespace-nowrap align-top",
                            depth > 0 ? "py-1.5 pl-11 text-muted-foreground" : "py-1.5",
                            l.kind === "indent" && "pl-8 text-muted-foreground",
                            strong && "font-semibold bg-muted",
                        )}
                    >
                        <span className="inline-flex items-center gap-1.5">
                            {canOpen ?
                                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !isOpen && "-rotate-90")} />
                            : depth === 0 && <span className="w-3.5" />}
                            {l.label}
                        </span>
                    </td>
                    {months.map((r, i) => {
                        const v = l.get(r)
                        return (
                            <td key={r.id} className="px-3 py-1.5 text-right align-top">
                                <Amt v={v} strong={strong} />
                                {l.margin && <div className="text-[11px] text-muted-foreground">marja {marja(v, num(r.income))}</div>}
                                {showDelta && i > 0 && (r._n ?? 1) === (months[i - 1]._n ?? 1) && (
                                    <Delta cur={v} prev={l.get(months[i - 1])} expense={l.expense} />
                                )}
                            </td>
                        )
                    })}
                    <td className={cn("sticky right-0 z-10 px-4 py-1.5 text-right align-top border-l", strong ? "bg-muted" : "bg-card")}>
                        <Amt v={total} strong />
                        {l.margin && <div className="text-[11px] text-muted-foreground">marja {marja(total, totIncome)}</div>}
                    </td>
                </tr>
                {isOpen && l.children?.map((c) => renderLine(c, depth + 1))}
            </Fragment>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 rounded-md border p-0.5 text-sm">
                        {PERIODS.map((p) => (
                            <button
                                key={p.v}
                                type="button"
                                onClick={() => setPeriod(p.v)}
                                className={cn("rounded px-3 py-1 transition-colors", period === p.v ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground")}
                            >
                                {p.l}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1 rounded-md border p-0.5 text-sm">
                        {(
                            [
                                ["m", "Oylar"],
                                ["q", "Choraklar"],
                                ["y", "Yillar"],
                            ] as const
                        ).map(([v, l]) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => setGroup(v)}
                                className={cn("rounded px-3 py-1 transition-colors", group === v ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground")}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                        <input type="checkbox" checked={showDelta} onChange={(e) => setShowDelta(e.target.checked)} />
                        O'zgarish %
                    </label>
                </div>
                {actions}
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                    { l: `Tushum (${monthCount} oy)`, v: totIncome },
                    { l: t("fin_report.lines.profit"), v: totProfit, m: marja(totProfit, totIncome) },
                    { l: "Jami xarajat", v: -(totIncome - totNet) },
                    { l: t("fin_report.lines.net"), v: totNet, m: marja(totNet, totIncome) },
                ].map((c) => (
                    <Card key={c.l}>
                        <CardContent className="p-4 flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">{c.l}</span>
                            <span className={cn("text-xl font-semibold tabular-nums", c.v < 0 && "text-destructive")}>
                                {c.v < 0 ? "−" : ""}
                                {amountText(Math.abs(c.v))} <span className="text-xs font-normal text-muted-foreground">so'm</span>
                            </span>
                            <span className="text-xs text-muted-foreground">{c.m ? `marja ${c.m}` : `o'rtacha oyiga ${amountText(Math.abs(c.v) / Math.max(monthCount, 1))}`}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardContent className="p-0">
                    <div ref={scrollRef} className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-xs text-muted-foreground">
                                <th className="sticky left-0 z-10 bg-card px-4 py-2.5 text-left font-medium min-w-[220px]">Ko'rsatkich</th>
                                {months.map((r) => (
                                    <th key={r.id} className="px-3 py-2 text-right font-medium min-w-[118px]">
                                        <button
                                            type="button"
                                            disabled={r.id < 0}
                                            onClick={() => onOpen(r.id)}
                                            className="group inline-flex flex-col items-end enabled:cursor-pointer"
                                            title={r.id < 0 ? undefined : "Batafsil / tahrirlash"}
                                        >
                                            <span className="inline-flex items-center gap-1.5 text-foreground whitespace-nowrap">
                                                <span className={cn(r.id > 0 && "underline-offset-2 group-hover:underline")}>{r.month_label}</span>
                                                {r.id > 0 && (
                                                    <SquareArrowOutUpRight className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
                                                )}
                                            </span>
                                            <span className={cn("text-[10px] font-normal", r.status === "approved" ? "text-green-600" : "text-amber-600")}>
                                                {r._n ? `${r._n} oy · ` : ""}
                                                {r.status === "approved" ? t("fin_report.status.approved") : t("fin_report.status.draft")}
                                            </span>
                                            {r.id > 0 && r.unpriced_count > 0 && (
                                                <span className="mt-0.5 rounded border border-amber-500/40 px-1 text-[10px] font-normal text-amber-600">
                                                    {t("fin_report.unpriced_short", { count: r.unpriced_count })}
                                                </span>
                                            )}
                                        </button>
                                    </th>
                                ))}
                                <th className="sticky right-0 z-10 bg-card px-4 py-2 text-right font-medium min-w-[140px] border-l text-foreground">Jami</th>
                            </tr>
                        </thead>
                        <tbody>{lines.map((l) => renderLine(l, 0))}</tbody>
                    </table>
                    </div>
                </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
                Oy nomini bossangiz — o'sha oyning batafsil sahifasi (tahrirlash, tasdiqlash, foyda taqsimoti) ochiladi. Qatorni bossangiz — ichidagi bo'limlar ochiladi. To'liq bo'lmagan chorak/yil uchun o'zgarish % ko'rsatilmaydi.
            </p>
        </div>
    )
}
