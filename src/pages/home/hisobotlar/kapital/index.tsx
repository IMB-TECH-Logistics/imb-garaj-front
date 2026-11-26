import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { amountText, num } from "@/pages/home/kontragent/api"
import { addMonths, format, startOfMonth } from "date-fns"
import { AlertTriangle, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Fragment, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// ---------- types ----------
type Amt = { bank: number; naqd: number }
type Detail = { label: string; bank: number; naqd: number }
type Step = {
    key: string
    label: string
    sign: "" | "+" | "−" | "±"
    hint?: string
    link?: string
    bank: number
    naqd: number
    details: Detail[]
}

const total = (a: Amt) => a.bank + a.naqd
const MLN = 1_000_000

// ---------- mock data (computed so everything reconciles) ----------
const split = (label: string, bank: number, naqd: number): Detail => ({ label, bank, naqd })

const buildMock = (monthStart: Date, hasGap: boolean) => {
    // month-dependent multiplier so ‹ › visibly changes numbers
    const seed = monthStart.getMonth() + 1
    const k = 0.9 + (seed % 5) * 0.05
    const r = (v: number) => Math.round((v * k) / 1000) * 1000
    const ym = format(monthStart, "yyyy-MM")
    const d = (day: number) => `${String(day).padStart(2, "0")}.${format(monthStart, "MM.yyyy")}`

    const open: Amt = { bank: r(1820 * MLN), naqd: r(640 * MLN) }

    const profitDetails: Detail[] = [
        split("Reyslardan tushum", r(690 * MLN), r(120 * MLN)),
        split("Yoqilg'i va yo'l xarajatlari", -r(215 * MLN), -r(18 * MLN)),
        split("Ta'mirlash va ehtiyot qismlar", -r(95 * MLN), -r(4 * MLN)),
        split("Ish haqi va boshqa xarajatlar", -r(70 * MLN), -r(3 * MLN)),
    ]
    const profit: Amt = {
        bank: profitDetails.reduce((s, x) => s + x.bank, 0),
        naqd: profitDetails.reduce((s, x) => s + x.naqd, 0),
    }

    const investDetails: Detail[] = [
        split(`${d(4)} · Izumi Invest — qo'shimcha mablag'`, r(150 * MLN), 0),
        split(`${d(18)} · Vodiy Star — yangi mashina uchun`, r(50 * MLN), 0),
    ]
    const invest: Amt = {
        bank: investDetails.reduce((s, x) => s + x.bank, 0),
        naqd: 0,
    }

    const divDetails: Detail[] = [
        split(`${d(10)} · Izumi Invest — dividend`, -r(70 * MLN), -r(20 * MLN)),
        split(`${d(10)} · Vodiy Star — dividend`, -r(50 * MLN), -r(25 * MLN)),
        split(`${d(10)} · Firma ulushi`, -r(30 * MLN), -r(15 * MLN)),
    ]
    const dividend: Amt = {
        bank: divDetails.reduce((s, x) => s + x.bank, 0),
        naqd: divDetails.reduce((s, x) => s + x.naqd, 0),
    }

    const revalDetails: Detail[] = [
        split("Mashinalar qiymati (eskirish va qayta baholash)", r(36 * MLN), 0),
        split("Valyuta kursi farqi (USD)", r(6 * MLN), -r(3 * MLN)),
    ]
    const reval: Amt = {
        bank: revalDetails.reduce((s, x) => s + x.bank, 0),
        naqd: revalDetails.reduce((s, x) => s + x.naqd, 0),
    }

    const manualDetails: Detail[] = [
        split(`${d(22)} · O'tgan oy xatosi: ikki marta yozilgan chiqim`, r(5 * MLN), 0),
        split(`${d(27)} · Qo'lda tuzatish: kassa qoldig'i`, -r(13 * MLN), r(5 * MLN)),
    ]
    const manual: Amt = {
        bank: manualDetails.reduce((s, x) => s + x.bank, 0),
        naqd: manualDetails.reduce((s, x) => s + x.naqd, 0),
    }

    const steps: Step[] = [
        { key: "open", label: "Davr boshidagi kapital", sign: "", ...open, details: [] },
        { key: "profit", label: "Davr sof foydasi", sign: "+", link: "Foyda va zarar hisobotidan", ...profit, details: profitDetails },
        { key: "invest", label: "Investorlar kiritgan kapital", sign: "+", ...invest, details: investDetails },
        { key: "dividend", label: "Investorlarga taqsimlangan foyda (dividend)", sign: "−", ...dividend, details: divDetails },
        { key: "reval", label: "Qayta baholash (mashina qiymati, kurs farqi)", sign: "±", ...reval, details: revalDetails },
        { key: "manual", label: "Qo'lda tuzatishlar / o'tgan davr xatolari", sign: "±", ...manual, details: manualDetails },
    ]
    const close: Amt = {
        bank: steps.reduce((s, x) => s + x.bank, 0),
        naqd: steps.reduce((s, x) => s + x.naqd, 0),
    }
    // balance-sheet capital; with gap there is an unexplained difference
    const gap: Amt = hasGap ? { bank: r(41 * MLN), naqd: -r(2 * MLN) } : { bank: 0, naqd: 0 }
    const balance: Amt = { bank: close.bank + gap.bank, naqd: close.naqd + gap.naqd }

    // investors
    const share = [
        { name: "Izumi Invest", open: 0.46, profit: 0.4, inv: 150 * MLN, div: [70, 20] },
        { name: "Vodiy Star", open: 0.34, profit: 0.35, inv: 50 * MLN, div: [50, 25] },
        { name: "Firma ulushi", open: 0.2, profit: 0.25, inv: 0, div: [30, 15] },
    ]
    const openT = total(open)
    const profitT = total(profit)
    const otherT = total(reval) + total(manual)
    const rows = share.map((s, i) => {
        const last = i === share.length - 1
        return {
            name: s.name,
            open: last ? 0 : Math.round(openT * s.open),
            profit: last ? 0 : Math.round(profitT * s.profit),
            other: last ? 0 : Math.round(otherT * s.profit),
            invested: s.inv === 0 ? 0 : r(s.inv),
            taken: -r((s.div[0] + s.div[1]) * MLN),
        }
    })
    const lastRow = rows[rows.length - 1]
    const rest = (f: "open" | "profit" | "other", t: number) => t - rows.slice(0, -1).reduce((s, x) => s + x[f], 0)
    lastRow.open = rest("open", openT)
    lastRow.profit = rest("profit", profitT)
    lastRow.other = rest("other", otherT)
    const investors = rows.map((x) => ({ ...x, end: x.open + x.profit + x.other + x.invested + x.taken }))

    return { ym, open, steps, close, gap, balance, investors }
}

// ---------- small UI ----------
const M = ({ v, strong, className }: { v: number; strong?: boolean; className?: string }) => (
    <span className={cn("tabular-nums whitespace-nowrap", strong && "font-semibold", v < 0 && "text-destructive", className)}>
        {v < 0 ? "−" : ""}
        {amountText(Math.abs(num(v)))}
    </span>
)

const Mln = (v: number) => `${v < 0 ? "−" : ""}${(Math.abs(v) / MLN).toFixed(1)} mln`

const thisMonth = () => startOfMonth(new Date())

// ---------- waterfall ----------
type Bar_ = { name: string; base: number; value: number; delta: number; kind: "total" | "up" | "down" }

const Waterfall = ({ steps, close }: { steps: Step[]; close: Amt }) => {
    const data = useMemo(() => {
        const out: Bar_[] = []
        let run = 0
        const short = ["Boshida", "Foyda", "Kiritilgan", "Dividend", "Qayta baholash", "Tuzatish"]
        steps.forEach((s, i) => {
            const v = total(s)
            if (i === 0) {
                out.push({ name: short[i], base: 0, value: v, delta: v, kind: "total" })
                run = v
            } else {
                const next = run + v
                out.push({ name: short[i], base: Math.min(run, next), value: Math.abs(v), delta: v, kind: v >= 0 ? "up" : "down" })
                run = next
            }
        })
        out.push({ name: "Oxirida", base: 0, value: total(close), delta: total(close), kind: "total" })
        return out
    }, [steps, close])
    const min = Math.min(...data.map((x) => (x.kind === "total" ? x.value : x.base)))
    const floor = Math.floor((min * 0.85) / (100 * MLN)) * 100 * MLN
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
                            <YAxis
                                domain={[floor, "auto"]}
                                allowDataOverflow
                                tick={{ fontSize: 11 }}
                                width={52}
                                tickFormatter={(v: number) => `${Math.round(v / MLN)}`}
                            />
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
                <div className="mt-1 text-xs text-muted-foreground">
                    Summalar mln so'mda. Vertikal o'q qisqartirilgan (o'zgarishlar ko'rinishi uchun).
                </div>
            </CardContent>
        </Card>
    )
}

// ---------- page ----------
export default function KapitalPage() {
    const [month, setMonth] = useState(thisMonth)
    const [hasGap, setHasGap] = useState(false)
    const [open, setOpen] = useState<Record<string, boolean>>({})
    const data = useMemo(() => buildMock(month, hasGap), [month, hasGap])
    const { steps, close, gap, balance, investors } = data
    const gapTotal = total(gap)
    const shift = (n: number) => setMonth((m) => addMonths(m, n))
    const monthLabel = format(month, "MM.yyyy")

    const invTotals = investors.reduce(
        (a, x) => ({
            open: a.open + x.open,
            profit: a.profit + x.profit,
            other: a.other + x.other,
            invested: a.invested + x.invested,
            taken: a.taken + x.taken,
            end: a.end + x.end,
        }),
        { open: 0, profit: 0, other: 0, invested: 0, taken: 0, end: 0 },
    )

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">
                        Xususiy kapital to'g'risida hisobot (Shakl №5): davr boshidan oxirigacha kapital nima sababdan o'zgargani.
                    </p>
                    <span className="w-fit rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                        Namuna ma'lumot (backend hali yo'q)
                    </span>
                </div>
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
                    <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm">
                        <input type="checkbox" checked={hasGap} onChange={(e) => setHasGap(e.target.checked)} />
                        Farq bor holat
                    </label>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <Card><CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Davr boshidagi kapital</div>
                    <div className="text-lg"><M v={total(data.open)} strong /></div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">O'zgarish</div>
                    <div className="text-lg">
                        <M v={total(close) - total(data.open)} strong className={total(close) - total(data.open) > 0 ? "text-green-600" : undefined} />
                    </div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Davr oxiridagi kapital</div>
                    <div className="text-lg"><M v={total(close)} strong /></div>
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
                            {steps.map((s) => {
                                const has = s.details.length > 0
                                const isOpen = open[s.key]
                                return (
                                    <Fragment key={s.key}>
                                        <tr
                                            className={cn("border-b", has && "cursor-pointer hover:bg-muted/30", s.key === "open" && "font-semibold")}
                                            onClick={() => has && setOpen((o) => ({ ...o, [s.key]: !o[s.key] }))}
                                        >
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-1.5 min-w-0">
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
                                                        {s.link && (
                                                            <span className="text-xs text-primary underline underline-offset-2">{s.link}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right"><M v={s.bank} /></td>
                                            <td className="px-3 py-2 text-right"><M v={s.naqd} /></td>
                                            <td className="px-3 py-2 text-right"><M v={total(s)} strong /></td>
                                        </tr>
                                        {isOpen &&
                                            s.details.map((x, i) => (
                                                <tr key={i} className="border-b bg-muted/20 text-xs">
                                                    <td className="py-1.5 pl-9 pr-3">{x.label}</td>
                                                    <td className="px-3 py-1.5 text-right"><M v={x.bank} /></td>
                                                    <td className="px-3 py-1.5 text-right"><M v={x.naqd} /></td>
                                                    <td className="px-3 py-1.5 text-right"><M v={x.bank + x.naqd} /></td>
                                                </tr>
                                            ))}
                                    </Fragment>
                                )
                            })}
                            <tr className="border-b bg-muted/40 font-semibold">
                                <td className="px-3 py-2"><span className="mr-1.5 text-muted-foreground">=</span>Davr oxiridagi kapital</td>
                                <td className="px-3 py-2 text-right"><M v={close.bank} strong /></td>
                                <td className="px-3 py-2 text-right"><M v={close.naqd} strong /></td>
                                <td className="px-3 py-2 text-right"><M v={total(close)} strong /></td>
                            </tr>
                            <tr className="border-b text-muted-foreground">
                                <td className="px-3 py-2">Balansdagi kapital</td>
                                <td className="px-3 py-2 text-right"><M v={balance.bank} /></td>
                                <td className="px-3 py-2 text-right"><M v={balance.naqd} /></td>
                                <td className="px-3 py-2 text-right"><M v={total(balance)} /></td>
                            </tr>
                            {gapTotal === 0 ? (
                                <tr className="font-semibold text-green-600">
                                    <td className="px-3 py-2">
                                        <span className="inline-flex items-center gap-1.5">
                                            Balansdagi kapital bilan farq: 0 <Check size={16} />
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right">0</td>
                                    <td className="px-3 py-2 text-right">0</td>
                                    <td className="px-3 py-2 text-right">0</td>
                                </tr>
                            ) : (
                                <tr className="bg-amber-50 font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                    <td className="px-3 py-2">
                                        <div className="inline-flex items-center gap-1.5">
                                            <AlertTriangle size={16} /> Tushuntirilmagan farq
                                        </div>
                                        <div className="text-xs font-normal">
                                            Bu farq kiritilmagan yoki noto'g'ri yozilgan operatsiya borligini bildiradi.
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-right"><M v={gap.bank} className="text-amber-700 dark:text-amber-400" /></td>
                                    <td className="px-3 py-2 text-right"><M v={gap.naqd} className="text-amber-700 dark:text-amber-400" /></td>
                                    <td className="px-3 py-2 text-right"><M v={gapTotal} className="text-amber-700 dark:text-amber-400" /></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <Waterfall steps={steps} close={close} />

            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead>
                            <tr className="border-b bg-muted/40 text-muted-foreground">
                                <th className="px-3 py-2 text-left font-medium">Investorlar kesimida</th>
                                <th className="px-3 py-2 text-right font-medium">Boshidagi ulush</th>
                                <th className="px-3 py-2 text-right font-medium">Foydadagi ulushi</th>
                                <th className="px-3 py-2 text-right font-medium">Kiritgan</th>
                                <th className="px-3 py-2 text-right font-medium">Olgan</th>
                                <th className="px-3 py-2 text-right font-medium" title="Qayta baholash va tuzatishlardagi ulushi">Boshqa</th>
                                <th className="px-3 py-2 text-right font-medium">Oxiridagi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {investors.map((x) => (
                                <tr key={x.name} className="border-b">
                                    <td className="px-3 py-2">{x.name}</td>
                                    <td className="px-3 py-2 text-right"><M v={x.open} /></td>
                                    <td className="px-3 py-2 text-right"><M v={x.profit} /></td>
                                    <td className="px-3 py-2 text-right"><M v={x.invested} /></td>
                                    <td className="px-3 py-2 text-right"><M v={x.taken} /></td>
                                    <td className="px-3 py-2 text-right"><M v={x.other} /></td>
                                    <td className="px-3 py-2 text-right"><M v={x.end} strong /></td>
                                </tr>
                            ))}
                            <tr className="bg-muted/40 font-semibold">
                                <td className="px-3 py-2">Jami</td>
                                <td className="px-3 py-2 text-right"><M v={invTotals.open} strong /></td>
                                <td className="px-3 py-2 text-right"><M v={invTotals.profit} strong /></td>
                                <td className="px-3 py-2 text-right"><M v={invTotals.invested} strong /></td>
                                <td className="px-3 py-2 text-right"><M v={invTotals.taken} strong /></td>
                                <td className="px-3 py-2 text-right"><M v={invTotals.other} strong /></td>
                                <td className="px-3 py-2 text-right"><M v={invTotals.end} strong /></td>
                            </tr>
                        </tbody>
                    </table>
                </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
                Investorlar jami = davr oxiridagi kapital ({Mln(total(close))} so'm). Jami qator yuqoridagi ko'prik bilan mos keladi.
            </p>
        </div>
    )
}
