import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { amountText, num } from "@/pages/home/kontragent/api"
import { useNavigate } from "@tanstack/react-router"
import { addDays, format, parseISO } from "date-fns"
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Search,
    TriangleAlert,
} from "lucide-react"
import { useMemo, useState } from "react"

type Kind = "mijoz" | "haydovchi" | "investor" | "taminotchi" | "zapravka" | "kontragent" | "ijara_dividend"
type Side = "debitor" | "kreditor"
type Money = string | number
type AgingApi = { d0_30: Money; d31_60: Money; d61_90: Money; d90p: Money; unknown?: Money }
type Row = {
    id: number | null
    key: string
    name: string
    type: Kind
    side: Side
    bank: Money
    naqd: Money
    total: Money
    source_row_key: string
    source_label: string
    last_activity: string | null
    aging: AgingApi | null
    link: { kind: "kontragent" | "station" | "driver" | "report"; id: number | null } | null
}
type SideData = {
    rows: Row[]
    total: { bank: Money; naqd: Money; total: Money }
    aging: AgingApi
}
type Report = {
    date: string
    debitor: SideData
    kreditor: SideData
    net: { bank: Money; naqd: Money; total: Money }
    overdue_90: { total: Money; debitor?: Money; kreditor?: Money }
    check: {
        debitor_balance: Money
        debitor_report: Money
        kreditor_balance: Money
        kreditor_report: Money
        ok: boolean
    }
}

const KIND_LABEL: Record<Kind, string> = {
    mijoz: "Mijoz",
    haydovchi: "Haydovchi",
    investor: "Investor",
    taminotchi: "Ta'minotchi",
    zapravka: "Zapravka",
    kontragent: "Kontragent",
    ijara_dividend: "Ijara / dividend",
}
const KIND_STYLE: Record<Kind, string> = {
    mijoz: "bg-blue-100 text-blue-700 border-blue-200",
    zapravka: "bg-orange-100 text-orange-700 border-orange-200",
    taminotchi: "bg-violet-100 text-violet-700 border-violet-200",
    haydovchi: "bg-teal-100 text-teal-700 border-teal-200",
    investor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    ijara_dividend: "bg-pink-100 text-pink-700 border-pink-200",
    kontragent: "bg-slate-200 text-slate-700 border-slate-300",
}
const BUCKETS = ["0–30 kun", "31–60 kun", "61–90 kun", "90+ kun"]
const BUCKET_KEYS = ["d0_30", "d31_60", "d61_90", "d90p"] as const
const BUCKET_BG = ["bg-emerald-500", "bg-sky-500", "bg-amber-500", "bg-red-500"]

type SortKey = "name" | "type" | "bank" | "naqd" | "total" | "b0" | "b1" | "b2" | "b3" | "last"
const BUCKET_SORT: Record<string, (typeof BUCKET_KEYS)[number]> = {
    b0: "d0_30",
    b1: "d31_60",
    b2: "d61_90",
    b3: "d90p",
}
const sortVal = (r: Row, k: SortKey): string | number => {
    if (k === "name") return r.name
    if (k === "type") return KIND_LABEL[r.type]
    if (k === "last") return r.last_activity ?? ""
    if (k in BUCKET_SORT) return r.aging ? num(r.aging[BUCKET_SORT[k]]) : -1
    return num(r[k as "bank" | "naqd" | "total"])
}

const Amt = ({ v, className }: { v: Money | null | undefined; className?: string }) => {
    const n = num(v)
    if (v === null || v === undefined || n === 0) return <span className="text-muted-foreground">—</span>
    return (
        <span className={cn("tabular-nums whitespace-nowrap", n < 0 && "text-destructive", className)}>
            {n < 0 ? "−" : ""}
            {amountText(Math.abs(n))}
        </span>
    )
}

const KindBadge = ({ kind }: { kind: Kind }) => (
    <Badge variant="outline" className={cn("whitespace-nowrap font-medium", KIND_STYLE[kind])}>
        {KIND_LABEL[kind]}
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

const AgingBar = ({ aging }: { aging: AgingApi }) => {
    const vals = BUCKET_KEYS.map((k) => num(aging[k]))
    const unknown = num(aging.unknown)
    const sum = vals.reduce((a, b) => a + b, 0) + unknown || 1
    return (
        <Card>
            <CardContent className="space-y-3 p-4">
                <div className="text-sm font-medium">Muddat bo'yicha taqsimot (aging)</div>
                <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
                    {vals.map((v, i) => (
                        <div key={i} className={BUCKET_BG[i]} style={{ width: `${(v / sum) * 100}%` }} title={BUCKETS[i]} />
                    ))}
                    {unknown > 0 && (
                        <div className="bg-slate-300" style={{ width: `${(unknown / sum) * 100}%` }} title="Muddati noma'lum" />
                    )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {vals.map((v, i) => (
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
                    {unknown > 0 && (
                        <div className="flex items-start gap-2 text-xs">
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm bg-slate-300" />
                            <div>
                                <div className="text-muted-foreground">Muddati noma'lum</div>
                                <div className="font-medium tabular-nums">
                                    {amountText(unknown)}{" "}
                                    <span className="text-muted-foreground">({Math.round((unknown / sum) * 100)}%)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

const fmtDate = (s: string | null) => (s ? format(parseISO(s), "dd.MM.yyyy") : null)

const PartyTable = ({ data }: { data: SideData }) => {
    const navigate = useNavigate()
    const [q, setQ] = useState("")
    const [kind, setKind] = useState<Kind | "all">("all")
    const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "total", dir: -1 })
    const rows = data.rows

    const kinds = useMemo(() => Array.from(new Set(rows.map((r) => r.type))), [rows])
    const list = useMemo(() => {
        const f = rows.filter(
            (r) => (kind === "all" || r.type === kind) && r.name.toLowerCase().includes(q.trim().toLowerCase()),
        )
        return f.sort((a, b) => {
            const x = sortVal(a, sort.key)
            const y = sortVal(b, sort.key)
            return (typeof x === "string" ? x.localeCompare(y as string) : x - (y as number)) * sort.dir
        })
    }, [rows, q, kind, sort])

    const tot = {
        bank: list.reduce((a, r) => a + num(r.bank), 0),
        naqd: list.reduce((a, r) => a + num(r.naqd), 0),
        total: list.reduce((a, r) => a + num(r.total), 0),
        aging: BUCKET_KEYS.map((k) => list.reduce((a, r) => a + (r.aging ? num(r.aging[k]) : 0), 0)),
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

    const canOpen = (r: Row) => r.link?.kind === "kontragent" && r.link.id != null
    const open = (r: Row) => {
        if (canOpen(r)) navigate({ to: "/kontragentlar/$id", params: { id: String(r.link!.id) } })
    }

    return (
        <div className="space-y-4">
            <AgingBar aging={data.aging} />
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
                                    {k === "all" ? "Hammasi" : KIND_LABEL[k]}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full min-w-[1150px] text-sm">
                            <thead className="bg-muted/50 text-xs text-muted-foreground">
                                <tr>
                                    {th("name", "Kontragent")}
                                    {th("type", "Turi")}
                                    {th("bank", "Bank", true)}
                                    {th("naqd", "Naqd", true)}
                                    {th("total", "Jami", true)}
                                    {th("b0", "0–30", true)}
                                    {th("b1", "31–60", true)}
                                    {th("b2", "61–90", true)}
                                    {th("b3", "90+", true)}
                                    {th("last", "Oxirgi harakat", true)}
                                </tr>
                            </thead>
                            <tbody>
                                {list.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="py-8 text-center text-muted-foreground">
                                            Ma'lumot topilmadi
                                        </td>
                                    </tr>
                                )}
                                {list.map((r) => (
                                    <tr
                                        key={r.key}
                                        className={cn("border-t hover:bg-muted/40", canOpen(r) && "cursor-pointer")}
                                        onClick={() => open(r)}
                                    >
                                        <td className="px-3 py-2">
                                            <div className="font-medium">{r.name}</div>
                                            {!canOpen(r) && (
                                                <div className="text-xs text-muted-foreground">{r.source_label}</div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <KindBadge kind={r.type} />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Amt v={r.bank} />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Amt v={r.naqd} />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Amt v={r.total} className="font-semibold" />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Amt v={r.aging?.d0_30} />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Amt v={r.aging?.d31_60} />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Amt v={r.aging?.d61_90} className="text-amber-600" />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Amt v={r.aging?.d90p} className="font-semibold text-destructive" />
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                                            {fmtDate(r.last_activity) ?? <span className="text-muted-foreground">—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 bg-muted/50 font-semibold">
                                    <td className="px-3 py-2">Jami ({list.length})</td>
                                    <td />
                                    <td className="px-3 py-2 text-right">
                                        <Amt v={tot.bank} />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Amt v={tot.naqd} />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Amt v={tot.total} />
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

const Check = ({ label, balance, report }: { label: string; balance: Money; report: Money }) => {
    const a = num(balance)
    const b = num(report)
    const ok = Math.round(a) === Math.round(b)
    const diff = b - a
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
                <div className="font-medium">
                    {label} {ok ? "✓" : ""}
                </div>
                <div className="tabular-nums text-muted-foreground">
                    Balansda {amountText(a)} so'm, hisobot jami {amountText(b)} so'm
                    {!ok && (
                        <span className="font-medium text-amber-700">
                            {" "}
                            — farq {diff < 0 ? "−" : "+"}
                            {amountText(Math.abs(diff))} so'm
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

const Compare = ({ data }: { data: Report }) => (
    <Card>
        <CardContent className="space-y-3 p-4">
            <div className="text-sm font-medium">Balans bilan solishtirish</div>
            <Check
                label="Balansdagi debitor = hisobot jami"
                balance={data.check.debitor_balance}
                report={data.check.debitor_report}
            />
            <Check
                label="Balansdagi kreditor = hisobot jami"
                balance={data.check.kreditor_balance}
                report={data.check.kreditor_report}
            />
        </CardContent>
    </Card>
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
    const dateStr = format(date, "yyyy-MM-dd")
    const { data, isLoading, isError } = useGet<Report>("kontragent/reports/debts", { params: { date: dateStr } })
    const isToday = dateStr === format(new Date(), "yyyy-MM-dd")

    const totalDeb = num(data?.debitor.total.total)
    const totalKre = num(data?.kreditor.total.total)
    const net = num(data?.net.total)

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
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi
                    title="Jami debitor (bizga qarz)"
                    value={totalDeb}
                    tone="green"
                    hint={data ? `${data.debitor.rows.length} ta qator` : undefined}
                />
                <Kpi
                    title="Jami kreditor (biz qarzmiz)"
                    value={totalKre}
                    hint={data ? `${data.kreditor.rows.length} ta qator` : undefined}
                />
                <Kpi title="Sof pozitsiya (debitor − kreditor)" value={net} tone={net < 0 ? "red" : "green"} />
                <Kpi
                    title="90+ kunlik muddati o'tgan qarz"
                    value={num(data?.overdue_90.total)}
                    tone="red"
                    hint="debitor + kreditor"
                />
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

            {isLoading && <div className="py-12 text-center text-sm text-muted-foreground">Yuklanmoqda…</div>}
            {isError && !isLoading && (
                <div className="py-12 text-center text-sm text-destructive">Ma'lumotni yuklab bo'lmadi</div>
            )}
            {data && view === "debitor" && <PartyTable key="d" data={data.debitor} />}
            {data && view === "kreditor" && <PartyTable key="k" data={data.kreditor} />}
            {data && view === "compare" && <Compare data={data} />}
        </div>
    )
}
