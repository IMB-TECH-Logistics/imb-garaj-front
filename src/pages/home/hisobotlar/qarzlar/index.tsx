import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { amountText } from "@/pages/home/kontragent/api"
import { addDays, format, startOfMonth } from "date-fns"
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    Search,
    TriangleAlert,
} from "lucide-react"
import { Fragment, useMemo, useState } from "react"

type Kind = "Mijoz" | "Zapravka" | "Ta'minotchi" | "Haydovchi" | "Investor" | "Ijara egasi" | "Soliq"
type Side = "debitor" | "kreditor"
type Aging = [number, number, number, number]
type Tx = { date: Date; doc: string; added: number; paid: number; balance: number }
type Party = {
    id: number
    name: string
    kind: Kind
    side: Side
    opening: number
    added: number
    paid: number
    closing: number
    aging: Aging
    lastPay: Date | null
    txs: Tx[]
}

const KIND_STYLE: Record<Kind, string> = {
    Mijoz: "bg-blue-100 text-blue-700 border-blue-200",
    Zapravka: "bg-orange-100 text-orange-700 border-orange-200",
    "Ta'minotchi": "bg-violet-100 text-violet-700 border-violet-200",
    Haydovchi: "bg-teal-100 text-teal-700 border-teal-200",
    Investor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Ijara egasi": "bg-pink-100 text-pink-700 border-pink-200",
    Soliq: "bg-slate-200 text-slate-700 border-slate-300",
}
const BUCKETS = ["0–30 kun", "31–60 kun", "61–90 kun", "90+ kun"]
const BUCKET_BG = ["bg-emerald-500", "bg-sky-500", "bg-amber-500", "bg-red-500"]
const M = 1_000_000

// [nomi, turi, tomon, to'langan, aging(0-30,31-60,61-90,90+), oxirgi to'lov (necha kun oldin | null)]
const RAW: [string, Kind, Side, number, Aging, number | null][] = [
    ["Vodiy Star MCHJ", "Mijoz", "debitor", 120 * M, [85 * M, 40 * M, 22 * M, 0], 6],
    ["Coca-Cola Ichimligi", "Mijoz", "debitor", 210 * M, [140 * M, 65 * M, 0, 0], 3],
    ["Izumi Logistics MCHJ", "Mijoz", "debitor", 95 * M, [48 * M, 30 * M, 18 * M, 12 * M], 11],
    ["Oltin Mato Tekstil", "Mijoz", "debitor", 60 * M, [20 * M, 15 * M, 25 * M, 34 * M], 41],
    ["Sirdaryo Agro Export", "Mijoz", "debitor", 0, [32 * M, 0, 0, 58 * M], null],
    ["Karimov Anvar", "Haydovchi", "debitor", 4 * M, [3.5 * M, 2 * M, 1.2 * M, 0], 9],
    ["Toshpulatov Jasur", "Haydovchi", "debitor", 2 * M, [1.8 * M, 0, 2.4 * M, 3.1 * M], 52],
    ["Avto Ehtiyot Plus MCHJ", "Ta'minotchi", "debitor", 30 * M, [12 * M, 8 * M, 0, 0], 14],
    ["Mersin Neft Gaz MCHJ", "Zapravka", "kreditor", 380 * M, [260 * M, 90 * M, 0, 0], 4],
    ["Petro Line Zapravka", "Zapravka", "kreditor", 150 * M, [88 * M, 36 * M, 21 * M, 9 * M], 18],
    ["Turon Avto Zapchast", "Ta'minotchi", "kreditor", 70 * M, [18 * M, 24 * M, 31 * M, 0], 27],
    ["Shina Servis MCHJ", "Ta'minotchi", "kreditor", 45 * M, [10 * M, 0, 0, 26 * M], 66],
    ["Rustamov Bahodir (mashina ijarasi)", "Ijara egasi", "kreditor", 40 * M, [24 * M, 0, 0, 0], 8],
    ["Nurmatov Sherzod (ijara)", "Ijara egasi", "kreditor", 36 * M, [18 * M, 18 * M, 0, 0], 33],
    ["Investor: Qodirov A.", "Investor", "kreditor", 0, [0, 0, 0, 220 * M], null],
    ["Yusupov Ulug'bek (oylik)", "Haydovchi", "kreditor", 14 * M, [9 * M, 0, 0, 0], 12],
    ["Soliq inspeksiyasi (QQS, ijtimoiy)", "Soliq", "kreditor", 55 * M, [42 * M, 0, 0, 0], 20],
]

const buildParties = (date: Date): Party[] =>
    RAW.map(([name, kind, side, paid, aging, lastAgo], i) => {
        const closing = aging.reduce((a, b) => a + b, 0)
        const added = Math.round(closing * 0.7 + paid * 0.6)
        const opening = closing + paid - added
        const ms = startOfMonth(date)
        const day = (n: number) => addDays(ms, Math.min(n, 27))
        const raw: Omit<Tx, "balance">[] = []
        const a1 = Math.round(added * 0.6)
        raw.push({ date: day(2 + (i % 4)), doc: `Reys №${4100 + i * 7}`, added: a1, paid: 0 })
        raw.push({ date: day(11 + (i % 5)), doc: `Reys №${4151 + i * 7}`, added: added - a1, paid: 0 })
        if (paid > 0) {
            const p1 = Math.round(paid * 0.5)
            raw.push({ date: day(7 + (i % 3)), doc: `To'lov №${200 + i}`, added: 0, paid: p1 })
            raw.push({ date: day(19 + (i % 4)), doc: `To'lov №${230 + i}`, added: 0, paid: paid - p1 })
        }
        raw.sort((a, b) => a.date.getTime() - b.date.getTime())
        let bal = opening
        const txs = raw.map((r) => ({ ...r, balance: (bal += r.added - r.paid) }))
        return {
            id: i,
            name,
            kind,
            side,
            opening,
            added,
            paid,
            closing,
            aging,
            lastPay: lastAgo === null ? null : addDays(date, -lastAgo),
            txs,
        }
    })

type SortKey = "name" | "opening" | "added" | "paid" | "closing" | "b0" | "b1" | "b2" | "b3" | "lastPay"
const sortVal = (p: Party, k: SortKey): string | number => {
    if (k === "name") return p.name
    if (k === "lastPay") return p.lastPay?.getTime() ?? 0
    if (k === "b0") return p.aging[0]
    if (k === "b1") return p.aging[1]
    if (k === "b2") return p.aging[2]
    if (k === "b3") return p.aging[3]
    return p[k]
}

const Amt = ({ v, className }: { v: number; className?: string }) =>
    v === 0 ? (
        <span className="text-muted-foreground">—</span>
    ) : (
        <span className={cn("tabular-nums whitespace-nowrap", className)}>{amountText(v)}</span>
    )

const KindBadge = ({ kind }: { kind: Kind }) => (
    <Badge variant="outline" className={cn("whitespace-nowrap font-medium", KIND_STYLE[kind])}>
        {kind}
    </Badge>
)

const Kpi = ({ title, value, tone, hint }: { title: string; value: number; tone?: "red" | "green"; hint?: string }) => (
    <Card>
        <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{title}</div>
            <div
                className={cn(
                    "mt-1 text-xl font-semibold tabular-nums",
                    tone === "red" && "text-destructive",
                    tone === "green" && "text-emerald-600",
                )}
            >
                {value < 0 ? "−" : ""}
                {amountText(Math.abs(value))} <span className="text-xs font-normal text-muted-foreground">so'm</span>
            </div>
            {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
        </CardContent>
    </Card>
)

const AgingBar = ({ totals }: { totals: Aging }) => {
    const sum = totals.reduce((a, b) => a + b, 0) || 1
    return (
        <Card>
            <CardContent className="space-y-3 p-4">
                <div className="text-sm font-medium">Muddat bo'yicha taqsimot (aging)</div>
                <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
                    {totals.map((v, i) => (
                        <div key={i} className={BUCKET_BG[i]} style={{ width: `${(v / sum) * 100}%` }} title={BUCKETS[i]} />
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {totals.map((v, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                            <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-sm", BUCKET_BG[i])} />
                            <div>
                                <div className="text-muted-foreground">{BUCKETS[i]}</div>
                                <div className="font-medium tabular-nums">
                                    {amountText(v)}{" "}
                                    <span className="text-muted-foreground">({Math.round((v / sum) * 100)}%)</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

const sumAging = (list: Party[]): Aging =>
    list.reduce<Aging>(
        (a, p) => [a[0] + p.aging[0], a[1] + p.aging[1], a[2] + p.aging[2], a[3] + p.aging[3]],
        [0, 0, 0, 0],
    )

const PartyTable = ({ rows }: { rows: Party[] }) => {
    const [q, setQ] = useState("")
    const [kind, setKind] = useState<Kind | "all">("all")
    const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "closing", dir: -1 })
    const [open, setOpen] = useState<number | null>(null)

    const kinds = useMemo(() => Array.from(new Set(rows.map((r) => r.kind))), [rows])
    const list = useMemo(() => {
        const f = rows.filter(
            (r) => (kind === "all" || r.kind === kind) && r.name.toLowerCase().includes(q.trim().toLowerCase()),
        )
        return f.sort((a, b) => {
            const x = sortVal(a, sort.key)
            const y = sortVal(b, sort.key)
            return (typeof x === "string" ? x.localeCompare(y as string) : x - (y as number)) * sort.dir
        })
    }, [rows, q, kind, sort])

    const tot = {
        opening: list.reduce((a, r) => a + r.opening, 0),
        added: list.reduce((a, r) => a + r.added, 0),
        paid: list.reduce((a, r) => a + r.paid, 0),
        closing: list.reduce((a, r) => a + r.closing, 0),
        aging: sumAging(list),
    }

    const th = (k: SortKey, label: string, right?: boolean) => (
        <th className={cn("px-3 py-2 font-medium", right ? "text-right" : "text-left")}>
            <button
                type="button"
                className={cn(
                    "inline-flex items-center gap-1 whitespace-nowrap hover:text-foreground",
                    right && "flex-row-reverse",
                )}
                onClick={() =>
                    setSort((s) => (s.key === k ? { key: k, dir: (s.dir * -1) as 1 | -1 } : { key: k, dir: -1 }))
                }
            >
                {label}
                {sort.key === k ? (
                    sort.dir === 1 ? (
                        <ArrowUp className="h-3 w-3" />
                    ) : (
                        <ArrowDown className="h-3 w-3" />
                    )
                ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                )}
            </button>
        </th>
    )

    return (
        <div className="space-y-4">
            <AgingBar totals={sumAging(rows)} />
            <Card>
                <CardContent className="space-y-3 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative sm:w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-8"
                                placeholder="Kontragent qidirish…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {(["all", ...kinds] as (Kind | "all")[]).map((k) => (
                                <Button
                                    key={k}
                                    size="sm"
                                    variant={kind === k ? "default" : "outline"}
                                    onClick={() => setKind(k)}
                                >
                                    {k === "all" ? "Hammasi" : k}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full min-w-[1200px] text-sm">
                            <thead className="bg-muted/50 text-xs text-muted-foreground">
                                <tr>
                                    <th className="w-8" />
                                    {th("name", "Kontragent")}
                                    <th className="px-3 py-2 text-left font-medium">Turi</th>
                                    {th("opening", "Boshlang'ich qoldiq", true)}
                                    {th("added", "Oy ichida oshdi", true)}
                                    {th("paid", "Oy ichida to'landi", true)}
                                    {th("closing", "Oxirgi qoldiq", true)}
                                    {th("b0", "0–30", true)}
                                    {th("b1", "31–60", true)}
                                    {th("b2", "61–90", true)}
                                    {th("b3", "90+", true)}
                                    {th("lastPay", "Oxirgi to'lov", true)}
                                </tr>
                            </thead>
                            <tbody>
                                {list.length === 0 && (
                                    <tr>
                                        <td colSpan={12} className="py-8 text-center text-muted-foreground">
                                            Ma'lumot topilmadi
                                        </td>
                                    </tr>
                                )}
                                {list.map((r) => (
                                    <Fragment key={r.id}>
                                        <tr
                                            className="cursor-pointer border-t hover:bg-muted/40"
                                            onClick={() => setOpen(open === r.id ? null : r.id)}
                                        >
                                            <td className="pl-2">
                                                <ChevronDown
                                                    className={cn(
                                                        "h-4 w-4 text-muted-foreground transition-transform",
                                                        open !== r.id && "-rotate-90",
                                                    )}
                                                />
                                            </td>
                                            <td className="px-3 py-2 font-medium">{r.name}</td>
                                            <td className="px-3 py-2">
                                                <KindBadge kind={r.kind} />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Amt v={r.opening} />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Amt v={r.added} />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Amt v={r.paid} />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Amt v={r.closing} className="font-semibold" />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Amt v={r.aging[0]} />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Amt v={r.aging[1]} />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Amt v={r.aging[2]} className="text-amber-600" />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Amt v={r.aging[3]} className="font-semibold text-destructive" />
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                                                {r.lastPay ? (
                                                    format(r.lastPay, "dd.MM.yyyy")
                                                ) : (
                                                    <span className="text-muted-foreground">to'lov yo'q</span>
                                                )}
                                            </td>
                                        </tr>
                                        {open === r.id && (
                                            <tr className="bg-muted/20">
                                                <td colSpan={12} className="p-3">
                                                    <div className="mb-2 text-xs font-medium text-muted-foreground">
                                                        {r.name} — operatsiyalar tarixi
                                                    </div>
                                                    <div className="overflow-x-auto rounded-md border bg-background">
                                                        <table className="w-full min-w-[560px] text-xs">
                                                            <thead className="text-muted-foreground">
                                                                <tr>
                                                                    <th className="px-3 py-1.5 text-left font-medium">Sana</th>
                                                                    <th className="px-3 py-1.5 text-left font-medium">
                                                                        Hujjat / reys
                                                                    </th>
                                                                    <th className="px-3 py-1.5 text-right font-medium">Oshdi</th>
                                                                    <th className="px-3 py-1.5 text-right font-medium">To'landi</th>
                                                                    <th className="px-3 py-1.5 text-right font-medium">Qoldiq</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr className="border-t text-muted-foreground">
                                                                    <td className="px-3 py-1.5">—</td>
                                                                    <td className="px-3 py-1.5">Boshlang'ich qoldiq</td>
                                                                    <td />
                                                                    <td />
                                                                    <td className="px-3 py-1.5 text-right tabular-nums">
                                                                        {amountText(r.opening)}
                                                                    </td>
                                                                </tr>
                                                                {r.txs.map((t, i) => (
                                                                    <tr key={i} className="border-t">
                                                                        <td className="whitespace-nowrap px-3 py-1.5 tabular-nums">
                                                                            {format(t.date, "dd.MM.yyyy")}
                                                                        </td>
                                                                        <td className="px-3 py-1.5">{t.doc}</td>
                                                                        <td className="px-3 py-1.5 text-right">
                                                                            <Amt v={t.added} />
                                                                        </td>
                                                                        <td className="px-3 py-1.5 text-right">
                                                                            <Amt v={t.paid} className="text-emerald-600" />
                                                                        </td>
                                                                        <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                                                                            {amountText(t.balance)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 bg-muted/50 font-semibold">
                                    <td />
                                    <td className="px-3 py-2">Jami ({list.length})</td>
                                    <td />
                                    <td className="px-3 py-2 text-right">
                                        <Amt v={tot.opening} />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Amt v={tot.added} />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Amt v={tot.paid} />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Amt v={tot.closing} />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Amt v={tot.aging[0]} />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Amt v={tot.aging[1]} />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Amt v={tot.aging[2]} className="text-amber-600" />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Amt v={tot.aging[3]} className="text-destructive" />
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Akt sverka namunasi: [kontragent, bizda, kontragentda]
const SVERKA: [string, number, number][] = [
    ["Vodiy Star MCHJ", 147 * M, 147 * M],
    ["Coca-Cola Ichimligi", 205 * M, 218 * M],
    ["Mersin Neft Gaz MCHJ", 350 * M, 350 * M],
    ["Petro Line Zapravka", 154 * M, 149.5 * M],
]

const Check = ({ label, a, b }: { label: string; a: number; b: number }) => {
    const ok = a === b
    return (
        <div
            className={cn(
                "flex items-start gap-3 rounded-md border p-3",
                ok ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
            )}
        >
            {ok ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            ) : (
                <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-600" />
            )}
            <div className="text-sm">
                <div className="font-medium">{label}</div>
                <div className="tabular-nums text-muted-foreground">
                    Balansda {amountText(a)} = shu hisobot jami {amountText(b)} {ok ? "✓" : "— farq bor"}
                </div>
            </div>
        </div>
    )
}

const Compare = ({ deb, kre }: { deb: number; kre: number }) => (
    <div className="space-y-4">
        <Card>
            <CardContent className="space-y-3 p-4">
                <div className="text-sm font-medium">Balans bilan solishtirish</div>
                {/* namunada balans qiymati hisobot jamiga teng deb olingan */}
                <Check label="Balansdagi debitor" a={deb} b={deb} />
                <Check label="Balansdagi kreditor" a={kre} b={kre} />
            </CardContent>
        </Card>
        <Card>
            <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium">Akt sverka (solishtirma dalolatnoma) namunasi</div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span tabIndex={0}>
                                    <Button variant="outline" size="sm" disabled>
                                        <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                                        Akt sverka Excel
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>backenddan keyin</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="overflow-x-auto rounded-md border">
                    <table className="w-full min-w-[560px] text-sm">
                        <thead className="bg-muted/50 text-xs text-muted-foreground">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium">Kontragent</th>
                                <th className="px-3 py-2 text-right font-medium">Bizda</th>
                                <th className="px-3 py-2 text-right font-medium">Kontragentda</th>
                                <th className="px-3 py-2 text-right font-medium">Farq</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SVERKA.map(([name, mine, theirs]) => {
                                const diff = mine - theirs
                                return (
                                    <tr key={name} className={cn("border-t", diff !== 0 && "bg-amber-50")}>
                                        <td className="px-3 py-2 font-medium">{name}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{amountText(mine)}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{amountText(theirs)}</td>
                                        <td
                                            className={cn(
                                                "px-3 py-2 text-right tabular-nums",
                                                diff !== 0 ? "font-semibold text-amber-700" : "text-emerald-600",
                                            )}
                                        >
                                            {diff === 0 ? "✓ mos" : `${diff < 0 ? "−" : "+"}${amountText(Math.abs(diff))}`}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-muted-foreground">
                    Farq bo'lsa, ikkala tomon hujjatlari (reys, to'lov) solishtirilib, sababi aniqlanadi.
                </p>
            </CardContent>
        </Card>
    </div>
)

type View = "debitor" | "kreditor" | "compare"

const TABS: { key: View; label: string }[] = [
    { key: "debitor", label: "Debitorlar (bizga qarz)" },
    { key: "kreditor", label: "Kreditorlar (biz qarzmiz)" },
    { key: "compare", label: "Solishtirma" },
]

export default function QarzlarHisobot() {
    const [date, setDate] = useState(new Date())
    const [view, setView] = useState<View>("debitor")
    const parties = useMemo(() => buildParties(date), [date])
    const deb = parties.filter((p) => p.side === "debitor")
    const kre = parties.filter((p) => p.side === "kreditor")
    const sum = (l: Party[]) => l.reduce((a, p) => a + p.closing, 0)
    const totalDeb = sum(deb)
    const totalKre = sum(kre)
    const overdue = parties.reduce((a, p) => a + p.aging[3], 0)
    const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

    return (
        <div className="space-y-4 p-1">
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={() => setDate((d) => addDays(d, -1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[110px] text-center text-sm font-medium tabular-nums">
                        {format(date, "dd.MM.yyyy")}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setDate((d) => addDays(d, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={isToday} onClick={() => setDate(new Date())}>
                        Bugun
                    </Button>
                </div>
                <Badge variant="secondary" className="font-normal text-muted-foreground">
                    Namuna ma'lumot (backend hali yo'q)
                </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi title="Jami debitor (bizga qarz)" value={totalDeb} tone="green" hint={`${deb.length} ta kontragent`} />
                <Kpi title="Jami kreditor (biz qarzmiz)" value={totalKre} hint={`${kre.length} ta kontragent`} />
                <Kpi
                    title="Sof pozitsiya (debitor − kreditor)"
                    value={totalDeb - totalKre}
                    tone={totalDeb - totalKre < 0 ? "red" : "green"}
                />
                <Kpi title="90+ kunlik muddati o'tgan qarz" value={overdue} tone="red" hint="debitor + kreditor" />
            </div>

            <div className="inline-flex max-w-full overflow-x-auto rounded-lg bg-muted p-1">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setView(t.key)}
                        className={cn(
                            "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                            view === t.key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {view === "debitor" && <PartyTable key="d" rows={deb} />}
            {view === "kreditor" && <PartyTable key="k" rows={kre} />}
            {view === "compare" && <Compare deb={totalDeb} kre={totalKre} />}
        </div>
    )
}
