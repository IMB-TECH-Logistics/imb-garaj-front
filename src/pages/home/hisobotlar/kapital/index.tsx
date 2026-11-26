import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { amountText, num } from "@/pages/home/kontragent/api"
import { useNavigate } from "@tanstack/react-router"
import { addMonths, format, startOfMonth } from "date-fns"
import { AlertTriangle, Check, ChevronDown, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { Fragment, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// ---------- types ----------
type Money = string | number | null | undefined
type Triple = { bank: Money; naqd: Money; total: Money }
type Kapital = { bank: Money; naqd: Money; total: Money; weighted: Money }
type BridgeDetail = { label: string; bank: Money; naqd: Money; total: Money }
type BridgeRow = {
    key: string
    label: string
    sign: string
    bank: Money
    naqd: Money
    total: Money
    note: string
    source: string
    details: BridgeDetail[]
}
type SourceDetail = { id: number | null; label: string; effect: Triple }
type Source = {
    key: string
    label: string
    section: "aktiv" | "majburiyat"
    source: string
    effect: Triple
    start: Triple
    end: Triple
    details: SourceDetail[]
}
type EquityData = {
    month: string
    start: { date: string; kapital: Kapital }
    end: { date: string; kapital: Kapital }
    change: { bank: Money; naqd: Money; total: Money; weighted: Money }
    bridge: BridgeRow[]
    unexplained: { total: Money; note: string }
    sources: Source[]
    report: { id: number; status: string; net: Money; dividends: Money } | null
}

const MLN = 1_000_000
const TOLERANCE = 1000

// ---------- small UI ----------
const M = ({ v, strong, className }: { v: Money; strong?: boolean; className?: string }) => {
    if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>
    const n = num(v)
    return (
        <span className={cn("tabular-nums whitespace-nowrap", strong && "font-semibold", n < 0 && "text-destructive", className)}>
            {n < 0 ? "−" : ""}
            {amountText(Math.abs(n))}
        </span>
    )
}

const thisMonth = () => startOfMonth(new Date())

// ---------- waterfall ----------
type Bar_ = { name: string; base: number; value: number; delta: number; kind: "total" | "up" | "down" }

const SHORT: Record<string, string> = {
    open: "Boshida",
    profit: "Foyda",
    dividend: "Dividend",
    unexplained: "Farq",
    close: "Oxirida",
}

const Waterfall = ({ bridge }: { bridge: BridgeRow[] }) => {
    const data = useMemo(() => {
        const out: Bar_[] = []
        let run = 0
        bridge.forEach((s) => {
            const v = num(s.total)
            const name = SHORT[s.key] ?? s.label
            if (s.key === "open" || s.key === "close") {
                out.push({ name, base: 0, value: v, delta: v, kind: "total" })
                run = v
            } else {
                const next = run + v
                out.push({ name, base: Math.min(run, next), value: Math.abs(v), delta: v, kind: v >= 0 ? "up" : "down" })
                run = next
            }
        })
        return out
    }, [bridge])
    const color = { total: "#64748b", up: "#16a34a", down: "#dc2626" }
    return (
        <Card>
            <CardContent className="p-4">
                <div className="mb-2 text-sm font-medium">Kapital o'zgarishi — ko'prik diagrammasi</div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                            <YAxis tick={{ fontSize: 11 }} width={52} tickFormatter={(v: number) => `${Math.round(v / MLN)}`} />
                            <Tooltip
                                cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))", fontSize: 12 }}
                                labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 600, marginBottom: 4 }}
                                formatter={(_v, _n, p) => [`${p.payload.delta < 0 ? "−" : ""}${amountText(Math.abs(p.payload.delta))} so'm`, "Summa"]}
                            />
                            <Bar dataKey="base" stackId="a" fill="transparent" isAnimationActive={false} />
                            <Bar dataKey="value" stackId="a" isAnimationActive={false}>
                                {data.map((x, i) => (
                                    <Cell key={i} fill={color[x.kind]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Summalar mln so'mda (nominal kapital).</div>
            </CardContent>
        </Card>
    )
}

// ---------- page ----------
export default function KapitalPage() {
    const navigate = useNavigate()
    const [month, setMonth] = useState(thisMonth)
    const [open, setOpen] = useState<Record<string, boolean>>({})
    const ym = format(month, "yyyy-MM")
    const { data, isLoading, isError } = useGet<EquityData>("kontragent/reports/equity", { params: { month: ym } })
    const shift = (n: number) => setMonth((m) => addMonths(m, n))
    const monthLabel = format(month, "MM.yyyy")
    const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }))

    const startK = data?.start.kapital
    const endK = data?.end.kapital
    const change = data ? num(data.change.total) : 0
    const diff = data ? num(data.unexplained.total) : 0
    const balanced = Math.abs(diff) < TOLERANCE

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    Xususiy kapital to'g'risida hisobot (Shakl №5): davr boshidan oxirigacha kapital nima sababdan o'zgargani.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center rounded-md border">
                        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => shift(-1)} title="Oldingi oy">
                            <ChevronLeft size={16} />
                        </Button>
                        <div className="w-24 text-center text-sm tabular-nums">{monthLabel}</div>
                        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => shift(1)} title="Keyingi oy">
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                    <Button size="sm" variant="outline" className="h-9" onClick={() => setMonth(thisMonth())}>
                        Shu oy
                    </Button>
                </div>
            </div>

            {isLoading && <div className="py-10 text-center text-sm text-muted-foreground">Yuklanmoqda...</div>}
            {isError && <div className="py-10 text-center text-sm text-destructive">Ma'lumotni yuklab bo'lmadi.</div>}
            {!isLoading && !isError && !data && (
                <div className="py-10 text-center text-sm text-muted-foreground">Ma'lumot yo'q.</div>
            )}

            {data && startK && endK && (
                <>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Card><CardContent className="p-4">
                            <div className="text-xs text-muted-foreground">Davr boshidagi kapital ({format(new Date(data.start.date), "dd.MM.yyyy")})</div>
                            <div className="text-lg"><M v={startK.total} strong /></div>
                            <div className="text-xs text-muted-foreground">×0.88: <M v={startK.weighted} /></div>
                        </CardContent></Card>
                        <Card><CardContent className="p-4">
                            <div className="text-xs text-muted-foreground">O'zgarish</div>
                            <div className="text-lg"><M v={data.change.total} strong className={change > 0 ? "text-green-600" : undefined} /></div>
                            <div className="text-xs text-muted-foreground">×0.88: <M v={data.change.weighted} /></div>
                        </CardContent></Card>
                        <Card><CardContent className="p-4">
                            <div className="text-xs text-muted-foreground">Davr oxiridagi kapital ({format(new Date(data.end.date), "dd.MM.yyyy")})</div>
                            <div className="text-lg"><M v={endK.total} strong /></div>
                            <div className="text-xs text-muted-foreground">×0.88: <M v={endK.weighted} /></div>
                        </CardContent></Card>
                    </div>

                    <Card>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full min-w-[620px] table-fixed text-sm">
                                <colgroup>
                                    <col />
                                    <col className="w-[19%]" />
                                    <col className="w-[19%]" />
                                    <col className="w-[21%]" />
                                </colgroup>
                                <thead>
                                    <tr className="border-b bg-muted/40 text-muted-foreground">
                                        <th className="px-3 py-2 text-left font-medium">Kapital o'zgarishi ko'prigi</th>
                                        <th className="px-3 py-2 text-right font-medium">Bank</th>
                                        <th className="px-3 py-2 text-right font-medium">Naqd</th>
                                        <th className="px-3 py-2 text-right font-medium">Jami</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.bridge.map((s) => {
                                        if (s.key === "unexplained") {
                                            return balanced ? (
                                                <tr key={s.key} className="border-b font-semibold text-green-600">
                                                    <td className="px-3 py-2">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <span className="text-muted-foreground">±</span> Tushuntirilmagan farq: 0 <Check size={16} />
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-right" />
                                                    <td className="px-3 py-2 text-right" />
                                                    <td className="px-3 py-2 text-right">0 ✓</td>
                                                </tr>
                                            ) : (
                                                <tr key={s.key} className="border-b bg-amber-50 font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                                    <td className="px-3 py-2">
                                                        <div className="inline-flex items-center gap-1.5">
                                                            <AlertTriangle size={16} /> Tushuntirilmagan farq
                                                        </div>
                                                        <div className="text-xs font-normal">
                                                            kiritilmagan yoki noto'g'ri yozilgan operatsiya bor — pastdagi o'zgarish manbalariga qarang
                                                        </div>
                                                        {data.unexplained.note && (
                                                            <div className="text-xs font-normal">{data.unexplained.note}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-right" />
                                                    <td className="px-3 py-2 text-right" />
                                                    <td className="px-3 py-2 text-right">
                                                        <M v={s.total} className="text-amber-700 dark:text-amber-400" />
                                                    </td>
                                                </tr>
                                            )
                                        }
                                        const has = s.details.length > 0
                                        const isOpen = open[`b:${s.key}`]
                                        const strong = s.key === "open" || s.key === "close"
                                        return (
                                            <Fragment key={s.key}>
                                                <tr
                                                    className={cn(
                                                        "border-b",
                                                        has && "cursor-pointer hover:bg-muted/30",
                                                        strong && "font-semibold",
                                                        s.key === "close" && "bg-muted/40",
                                                    )}
                                                    onClick={() => has && toggle(`b:${s.key}`)}
                                                >
                                                    <td className="px-3 py-2">
                                                        <div className="flex min-w-0 items-center gap-1.5">
                                                            {has ? (
                                                                isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />
                                                            ) : (
                                                                <span className="w-[15px]" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <div className="leading-snug">
                                                                    {s.sign && <span className="mr-1.5 text-muted-foreground">{s.sign}</span>}
                                                                    {s.label}
                                                                </div>
                                                                {s.key === "profit" && data.report && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="link"
                                                                        className="h-auto gap-1 p-0 text-xs"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            navigate({ to: "/moliyaviy-hisobot/$id", params: { id: String(data.report!.id) } })
                                                                        }}
                                                                    >
                                                                        Oylik hisobotni ochish <ExternalLink size={12} />
                                                                    </Button>
                                                                )}
                                                                {s.note && <div className="text-xs font-normal text-muted-foreground">{s.note}</div>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-right"><M v={s.bank} /></td>
                                                    <td className="px-3 py-2 text-right"><M v={s.naqd} /></td>
                                                    <td className="px-3 py-2 text-right"><M v={s.total} strong /></td>
                                                </tr>
                                                {isOpen &&
                                                    s.details.map((x, i) => (
                                                        <tr key={i} className="border-b bg-muted/20 text-xs">
                                                            <td className="py-1.5 pl-9 pr-3">{x.label}</td>
                                                            <td className="px-3 py-1.5 text-right"><M v={x.bank} /></td>
                                                            <td className="px-3 py-1.5 text-right"><M v={x.naqd} /></td>
                                                            <td className="px-3 py-1.5 text-right"><M v={x.total} /></td>
                                                        </tr>
                                                    ))}
                                            </Fragment>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    <Waterfall bridge={data.bridge} />

                    <Card>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full min-w-[720px] table-fixed text-sm">
                                <colgroup>
                                    <col />
                                    <col className="w-[16%]" />
                                    <col className="w-[16%]" />
                                    <col className="w-[18%]" />
                                </colgroup>
                                <thead>
                                    <tr className="border-b bg-muted/40 text-muted-foreground">
                                        <th className="px-3 py-2 text-left font-medium">O'zgarish manbalari (kapitalga ta'siri)</th>
                                        <th className="px-3 py-2 text-right font-medium">Bank</th>
                                        <th className="px-3 py-2 text-right font-medium">Naqd</th>
                                        <th className="px-3 py-2 text-right font-medium">Jami</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.sources.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                                                Bu davrda balans qatorlari o'zgarmagan.
                                            </td>
                                        </tr>
                                    )}
                                    {data.sources.map((s) => {
                                        const k = `s:${s.section}:${s.key}`
                                        const has = s.details.length > 0
                                        const isOpen = open[k]
                                        return (
                                            <Fragment key={k}>
                                                <tr
                                                    className={cn("border-b", has && "cursor-pointer hover:bg-muted/30")}
                                                    onClick={() => has && toggle(k)}
                                                >
                                                    <td className="px-3 py-2">
                                                        <div className="flex min-w-0 items-center gap-1.5">
                                                            {has ? (
                                                                isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />
                                                            ) : (
                                                                <span className="w-[15px]" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <div className="leading-snug">{s.label}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {s.section === "aktiv" ? "Aktiv" : "Majburiyat"}
                                                                    {" · "}
                                                                    <M v={s.start.total} /> → <M v={s.end.total} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-right"><M v={s.effect.bank} /></td>
                                                    <td className="px-3 py-2 text-right"><M v={s.effect.naqd} /></td>
                                                    <td className="px-3 py-2 text-right"><M v={s.effect.total} strong /></td>
                                                </tr>
                                                {isOpen &&
                                                    s.details.map((x, i) => (
                                                        <tr key={i} className="border-b bg-muted/20 text-xs">
                                                            <td className="py-1.5 pl-9 pr-3">{x.label}</td>
                                                            <td className="px-3 py-1.5 text-right"><M v={x.effect.bank} /></td>
                                                            <td className="px-3 py-1.5 text-right"><M v={x.effect.naqd} /></td>
                                                            <td className="px-3 py-1.5 text-right"><M v={x.effect.total} /></td>
                                                        </tr>
                                                    ))}
                                            </Fragment>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                    <p className="text-xs text-muted-foreground">
                        Majburiyat oshishi kapitalni kamaytiradi, shuning uchun «Jami» ustuni kapitalga sof ta'sirni ko'rsatadi. Manbalar yig'indisi = kapital o'zgarishi.
                    </p>
                </>
            )}
        </div>
    )
}
