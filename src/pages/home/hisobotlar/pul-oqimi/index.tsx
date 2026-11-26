import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { amountText } from "@/pages/home/kontragent/api"
import { addMonths, format, getDaysInMonth, startOfMonth } from "date-fns"
import { ArrowDownCircle, ArrowUpCircle, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Wallet } from "lucide-react"
import { Fragment, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

/* ---------- Namuna ma'lumot (mock) ---------- */

type Item = { label: string; bank: number; naqd: number }
type Line = { key: string; label: string; items: Item[] }
type SectionDef = { key: string; title: string; kirim: Line[]; chiqim: Line[] }

const MLN = 1_000_000
const it = (label: string, bank: number, naqd: number): Item => ({ label, bank: Math.round(bank), naqd: Math.round(naqd) })

// k — oyga qarab o'zgaruvchan koeffitsient
const buildSections = (k: number): SectionDef[] => {
    const s = (v: number) => v * k
    return [
        {
            key: "op",
            title: "Asosiy (operatsion) faoliyat",
            kirim: [
                {
                    key: "op_in_reys",
                    label: "Mijozlardan reys puli",
                    items: [
                        it("Izumi Cola MChJ", s(412 * MLN), s(18 * MLN)),
                        it("Vodiy Soft Hub", s(268 * MLN), s(9 * MLN)),
                        it("Oltin Mato", s(131 * MLN), s(24 * MLN)),
                        it("Boshqa mijozlar (11 ta)", s(96 * MLN), s(37 * MLN)),
                    ],
                },
                {
                    key: "op_in_xizmat",
                    label: "Boshqa xizmatlar (ijara, ekspeditsiya)",
                    items: [it("Ekspeditsiya xizmati", s(14 * MLN), s(2 * MLN)), it("Treyler ijarasi", s(9 * MLN), s(5 * MLN))],
                },
                {
                    key: "op_in_avans",
                    label: "Haydovchilardan qaytgan avans",
                    items: [it("Haydovchilar (23 ta)", 0, s(21.4 * MLN))],
                },
                {
                    key: "op_in_transfer",
                    label: "Bankdan kassaga naqdlashtirish (ichki o'tkazma)",
                    items: [it("Bank kartadan naqdlashtirish", -s(118 * MLN), s(118 * MLN))],
                },
            ],
            chiqim: [
                {
                    key: "op_out_fuel",
                    label: "Yoqilg'i (zapravkalar)",
                    items: [
                        it("Zapravka «Mustang» (Toshkent)", s(98 * MLN), s(3 * MLN)),
                        it("Zapravka «Sirdaryo OIL»", s(74 * MLN), 0),
                        it("Zapravka «Sharq Petrol»", s(51 * MLN), s(6 * MLN)),
                        it("Boshqa zapravkalar", s(42 * MLN), s(14 * MLN)),
                    ],
                },
                {
                    key: "op_out_salary",
                    label: "Haydovchi oyligi va avanslari",
                    items: [it("Oylik to'lovlari", s(82 * MLN), s(19 * MLN)), it("Reys avanslari", 0, s(96 * MLN)), it("Kunlik xarajat (komandirovka)", 0, s(27 * MLN))],
                },
                {
                    key: "op_out_repair",
                    label: "Ta'mir va ehtiyot qismlar",
                    items: [it("«Avto-Servis Plus»", s(31 * MLN), s(2 * MLN)), it("Shinalar (Michelin ta'minotchi)", s(26 * MLN), 0), it("Mayda ta'mir (naqd)", 0, s(11.5 * MLN))],
                },
                {
                    key: "op_out_rent",
                    label: "Ijara to'lovi (avtobaza, ofis)",
                    items: [it("Avtobaza ijarasi", s(12 * MLN), 0), it("Ofis ijarasi", s(4.5 * MLN), 0)],
                },
                {
                    key: "op_out_tax",
                    label: "Soliqlar",
                    items: [it("QQS", s(34 * MLN), 0), it("Ijtimoiy soliq", s(16.8 * MLN), 0), it("Boshqa soliqlar", s(5.2 * MLN), 0)],
                },
                { key: "op_out_bank", label: "Bank xizmati", items: [it("Komissiyalar", s(3.1 * MLN), 0)] },
                {
                    key: "op_out_other",
                    label: "Boshqa chiqimlar",
                    items: [it("Yo'l to'lovlari, jarimalar", s(2.6 * MLN), s(4.9 * MLN)), it("Kantselyariya va xo'jalik", 0, s(2.2 * MLN))],
                },
            ],
        },
        {
            key: "inv",
            title: "Investitsiya faoliyati",
            kirim: [{ key: "inv_in_sell", label: "Asosiy vositalarni sotishdan tushum", items: [it("MAN TGX 2014 (sotildi)", s(95 * MLN), 0)] }],
            chiqim: [
                {
                    key: "inv_out_buy",
                    label: "Mashina, tirkama va jihoz sotib olish",
                    items: [it("Tirkama Schmitz 13.6 m", s(180 * MLN), 0), it("Diagnostika uskunasi", s(11 * MLN), s(2 * MLN))],
                },
            ],
        },
        {
            key: "fin",
            title: "Moliyaviy faoliyat",
            kirim: [
                {
                    key: "fin_in_inv",
                    label: "Investordan olingan pul / avans",
                    items: [it("Investor A. Karimov", s(150 * MLN), 0), it("Investor B. Rahimov", s(60 * MLN), 0)],
                },
                { key: "fin_in_loan", label: "Kredit olish", items: [it("Xalq banki (aylanma mablag')", s(120 * MLN), 0)] },
            ],
            chiqim: [
                { key: "fin_out_loan", label: "Kreditni qaytarish", items: [it("Asosiy qarz + foiz", s(85 * MLN), 0)] },
                {
                    key: "fin_out_div",
                    label: "Foyda taqsimoti (dividend) to'lovi",
                    items: [it("Firma ulushi", s(70 * MLN), 0), it("Investorlar ulushi", s(48 * MLN), s(12 * MLN))],
                },
            ],
        },
    ]
}

/* ---------- Hisob-kitob ---------- */

type Amt = { bank: number; naqd: number }
const sum = (xs: Amt[]): Amt => xs.reduce((a, x) => ({ bank: a.bank + x.bank, naqd: a.naqd + x.naqd }), { bank: 0, naqd: 0 })
const total = (a: Amt) => a.bank + a.naqd

// deterministik "tasodifiy" son
const rnd = (n: number) => {
    const x = Math.sin(n * 12.9898) * 43758.5453
    return x - Math.floor(x)
}

const buildDaily = (days: number, kirim: number, chiqim: number, seed: number) => {
    const wk = Array.from({ length: days }, (_, i) => 0.4 + rnd(seed + i * 3))
    const wc = Array.from({ length: days }, (_, i) => 0.4 + rnd(seed + i * 5 + 1))
    const sk = wk.reduce((a, b) => a + b, 0)
    const sc = wc.reduce((a, b) => a + b, 0)
    let rk = kirim
    let rc = chiqim
    return Array.from({ length: days }, (_, i) => {
        const last = i === days - 1
        const k = last ? rk : Math.round((kirim * wk[i]) / sk)
        const c = last ? rc : Math.round((chiqim * wc[i]) / sc)
        rk -= k
        rc -= c
        return { day: i + 1, kirim: k, chiqim: c }
    })
}

const useReport = (date: string) =>
    useMemo(() => {
        const d = new Date(date)
        const seed = d.getFullYear() * 12 + d.getMonth()
        const k = 0.85 + (seed % 9) / 30
        const sections = buildSections(k).map((sec) => {
            const kirim = sum(sec.kirim.flatMap((l) => l.items))
            const chiqim = sum(sec.chiqim.flatMap((l) => l.items))
            return { ...sec, sumKirim: kirim, sumChiqim: chiqim, net: { bank: kirim.bank - chiqim.bank, naqd: kirim.naqd - chiqim.naqd } }
        })
        const kirim = sum(sections.map((s) => s.sumKirim))
        const chiqim = sum(sections.map((s) => s.sumChiqim))
        const net: Amt = { bank: kirim.bank - chiqim.bank, naqd: kirim.naqd - chiqim.naqd }
        const opening: Amt = { bank: Math.round(210 * MLN * k) + (seed % 7) * MLN, naqd: Math.round(38.5 * MLN * k) }
        const closing: Amt = { bank: opening.bank + net.bank, naqd: opening.naqd + net.naqd }
        const daily = buildDaily(getDaysInMonth(d), total(kirim), total(chiqim), seed)
        return { sections, kirim, chiqim, net, opening, closing, daily }
    }, [date])

/* ---------- UI ---------- */

const M = ({ v, strong, sign }: { v: number; strong?: boolean; sign?: "in" | "out" }) => {
    const val = sign === "out" ? -v : v
    return (
        <span className={cn("tabular-nums whitespace-nowrap", strong && "font-semibold", val < 0 && "text-destructive")}>
            {val < 0 ? "−" : ""}
            {amountText(Math.abs(val))}
        </span>
    )
}

const thisMonth = () => format(startOfMonth(new Date()), "yyyy-MM-dd")
const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"]

const Kpi = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: string }) => (
    <Card>
        <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {icon}
                {label}
            </div>
            <div className={cn("mt-1 text-base sm:text-lg", tone)}>
                <M v={value} strong />
            </div>
        </CardContent>
    </Card>
)

const Tot = ({ label, a, className, sign }: { label: string; a: Amt; className?: string; sign?: "in" | "out" }) => (
    <tr className={cn("border-b font-semibold", className)}>
        <td className="px-3 py-2">{label}</td>
        <td className="px-3 py-2 text-right"><M v={a.bank} strong sign={sign} /></td>
        <td className="px-3 py-2 text-right"><M v={a.naqd} strong sign={sign} /></td>
        <td className="px-3 py-2 text-right"><M v={total(a)} strong sign={sign} /></td>
    </tr>
)

export default function PulOqimiPage() {
    const [date, setDate] = useState(thisMonth)
    const [open, setOpen] = useState<Record<string, boolean>>({})
    const r = useReport(date)
    const shift = (n: number) => setDate(format(addMonths(startOfMonth(new Date(date)), n), "yyyy-MM-dd"))
    const d = new Date(date)
    const monthLabel = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`

    const renderLine = (l: Line, sign: "in" | "out") => {
        const a = sum(l.items)
        const isOpen = open[l.key]
        return (
            <Fragment key={l.key}>
                <tr className="border-b cursor-pointer hover:bg-muted/30" onClick={() => setOpen((o) => ({ ...o, [l.key]: !o[l.key] }))}>
                    <td className="py-2 pl-6 pr-3">
                        <div className="flex items-center gap-1.5">
                            {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            <span className="leading-snug">{l.label}</span>
                        </div>
                    </td>
                    <td className="px-3 py-2 text-right"><M v={a.bank} sign={sign} /></td>
                    <td className="px-3 py-2 text-right"><M v={a.naqd} sign={sign} /></td>
                    <td className="px-3 py-2 text-right"><M v={total(a)} strong sign={sign} /></td>
                </tr>
                {isOpen &&
                    l.items.map((x, i) => (
                        <tr key={i} className="border-b bg-muted/20 text-xs">
                            <td className="py-1.5 pl-14 pr-3">{x.label}</td>
                            <td className="px-3 py-1.5 text-right"><M v={x.bank} sign={sign} /></td>
                            <td className="px-3 py-1.5 text-right"><M v={x.naqd} sign={sign} /></td>
                            <td className="px-3 py-1.5 text-right"><M v={x.bank + x.naqd} sign={sign} /></td>
                        </tr>
                    ))}
            </Fragment>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold">Pul oqimlari to'g'risida hisobot (Shakl №4)</h2>
                    <span className="mt-1 inline-block rounded-full border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                        Namuna ma'lumot (backend hali yo'q)
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center rounded-md border">
                        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => shift(-1)} title="Oldingi oy">
                            <ChevronLeft size={16} />
                        </Button>
                        <div className="min-w-36 px-2 text-center text-sm font-medium">{monthLabel}</div>
                        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => shift(1)} title="Keyingi oy">
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                    <Button size="sm" variant="outline" className="h-9" onClick={() => setDate(thisMonth())}>
                        Shu oy
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi icon={<Wallet size={14} />} label="Boshlang'ich qoldiq" value={total(r.opening)} />
                <Kpi icon={<ArrowUpCircle size={14} className="text-green-600" />} label="Kirim" value={total(r.kirim)} tone="text-green-600" />
                <Kpi icon={<ArrowDownCircle size={14} className="text-destructive" />} label="Chiqim" value={-total(r.chiqim)} />
                <Kpi icon={<Wallet size={14} />} label="Oxirgi qoldiq" value={total(r.closing)} />
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium">Kunlik pul harakati</span>
                        <span className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />Kirim</span>
                            <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" />Chiqim</span>
                        </span>
                    </div>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={r.daily} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 11 }} width={44} tickFormatter={(v: number) => `${Math.round(v / MLN)}M`} />
                                <Tooltip
                                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))", fontSize: 12 }}
                                    labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 600, marginBottom: 4 }}
                                    formatter={(v: number, n: string) => [amountText(v), n === "kirim" ? "Kirim" : "Chiqim"]}
                                    labelFormatter={(l) => `${l}-kun`}
                                />
                                <Bar isAnimationActive={false} dataKey="kirim" fill="#22c55e" radius={[2, 2, 0, 0]} />
                                <Bar isAnimationActive={false} dataKey="chiqim" fill="#ef4444" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full min-w-[640px] table-fixed text-sm">
                        <colgroup>
                            <col />
                            <col className="w-[20%]" />
                            <col className="w-[20%]" />
                            <col className="w-[22%]" />
                        </colgroup>
                        <thead>
                            <tr className="border-b bg-muted/40 text-muted-foreground">
                                <th className="px-3 py-2 text-left font-medium">Ko'rsatkich</th>
                                <th className="px-3 py-2 text-right font-medium">Bank</th>
                                <th className="px-3 py-2 text-right font-medium">Naqd (kassa)</th>
                                <th className="px-3 py-2 text-right font-medium">Jami</th>
                            </tr>
                        </thead>
                        <tbody>
                            <Tot label="Davr boshidagi pul qoldig'i" a={r.opening} className="bg-muted/40" />
                            {r.sections.map((sec, i) => (
                                <Fragment key={sec.key}>
                                    <tr className="border-b">
                                        <td colSpan={4} className="bg-muted/20 px-3 py-2 font-semibold">
                                            {i + 1}. {sec.title}
                                        </td>
                                    </tr>
                                    <tr className="border-b text-xs uppercase tracking-wide text-green-700">
                                        <td colSpan={4} className="px-3 py-1 pl-6">Kirim (+)</td>
                                    </tr>
                                    {sec.kirim.map((l) => renderLine(l, "in"))}
                                    <Tot label="Jami kirim" a={sec.sumKirim} className="text-green-700 text-xs" />
                                    <tr className="border-b text-xs uppercase tracking-wide text-destructive">
                                        <td colSpan={4} className="px-3 py-1 pl-6">Chiqim (−)</td>
                                    </tr>
                                    {sec.chiqim.map((l) => renderLine(l, "out"))}
                                    <Tot label="Jami chiqim" a={sec.sumChiqim} sign="out" className="text-xs" />
                                    <Tot label="Sof pul oqimi" a={sec.net} className="bg-muted/40" />
                                </Fragment>
                            ))}
                            <Tot label="Davr uchun sof pul oqimi" a={r.net} className="bg-muted/40" />
                            <Tot label="Davr oxiridagi pul qoldig'i" a={r.closing} className="bg-muted/60" />
                            <tr className="bg-green-50 font-semibold text-green-700 dark:bg-green-950/30">
                                <td className="px-3 py-2">
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle2 size={16} />
                                        Balans bilan solishtirish: balansdagi pul ✓ mos
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">{amountText(r.closing.bank)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{amountText(r.closing.naqd)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{amountText(total(r.closing))}</td>
                            </tr>
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    )
}
