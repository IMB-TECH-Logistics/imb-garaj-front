import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { amountText, num } from "@/pages/home/kontragent/api"
import { addMonths, format, startOfMonth } from "date-fns"
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Wallet } from "lucide-react"
import { Fragment, useState } from "react"

/* ---------- API turlari ---------- */

type Money = string | number | null
type Amt = { bank: Money; naqd: Money; total: Money }
type Detail = Amt & { label: string }
type Line = Amt & { key: string; label: string; details: Detail[] }
type Section = { key: string; label: string; kirim: Line[]; chiqim: Line[]; net: Amt }
type Report = {
    month: string
    kassa_v2: boolean
    opening: Amt
    sections: Section[]
    transfers: Line[]
    net: Amt
    closing: Amt
    check: { ok: boolean; balance_closing: Amt; diff: Amt }
    notes: string[]
}

/* ---------- Hisob-kitob ---------- */

const sumLines = (lines: Line[]): Amt => ({
    bank: lines.reduce((a, l) => a + num(l.bank), 0),
    naqd: lines.reduce((a, l) => a + num(l.naqd), 0),
    total: lines.reduce((a, l) => a + num(l.total), 0),
})

/* ---------- UI ---------- */

const M = ({ v, strong }: { v: Money; strong?: boolean }) => {
    if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>
    const val = num(v)
    return (
        <span className={cn("tabular-nums whitespace-nowrap", strong && "font-semibold", val < 0 && "text-destructive")}>
            {val < 0 ? "−" : ""}
            {amountText(Math.abs(val))}
        </span>
    )
}

const thisMonth = () => format(startOfMonth(new Date()), "yyyy-MM-dd")
const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"]

const Kpi = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: Money; tone?: string }) => (
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

const Tot = ({ label, a, className }: { label: string; a: Amt; className?: string }) => (
    <tr className={cn("border-b font-semibold", className)}>
        <td className="px-3 py-2">{label}</td>
        <td className="px-3 py-2 text-right"><M v={a.bank} strong /></td>
        <td className="px-3 py-2 text-right"><M v={a.naqd} strong /></td>
        <td className="px-3 py-2 text-right"><M v={a.total} strong /></td>
    </tr>
)

const signed = (v: Money) => `${num(v) < 0 ? "−" : ""}${amountText(Math.abs(num(v)))}`

export default function PulOqimiPage() {
    const [date, setDate] = useState(thisMonth)
    const [open, setOpen] = useState<Record<string, boolean>>({})
    const month = date.slice(0, 7)
    const { data: r, isLoading, isError } = useGet<Report>("kontragent/reports/cash-flow", { params: { month } })
    const shift = (n: number) => setDate(format(addMonths(startOfMonth(new Date(date)), n), "yyyy-MM-dd"))
    const d = new Date(date)
    const monthLabel = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`

    const renderLine = (l: Line, id: string) => {
        const isOpen = open[id]
        const expandable = l.details.length > 0
        return (
            <Fragment key={id}>
                <tr
                    className={cn("border-b hover:bg-muted/30", expandable && "cursor-pointer")}
                    onClick={() => expandable && setOpen((o) => ({ ...o, [id]: !o[id] }))}
                >
                    <td className="py-2 pl-6 pr-3">
                        <div className="flex items-center gap-1.5">
                            {expandable ? isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} /> : <span className="w-[15px]" />}
                            <span className="leading-snug">{l.label}</span>
                        </div>
                    </td>
                    <td className="px-3 py-2 text-right"><M v={l.bank} /></td>
                    <td className="px-3 py-2 text-right"><M v={l.naqd} /></td>
                    <td className="px-3 py-2 text-right"><M v={l.total} strong /></td>
                </tr>
                {isOpen &&
                    l.details.map((x, i) => (
                        <tr key={i} className="border-b bg-muted/20 text-xs">
                            <td className="py-1.5 pl-14 pr-3">{x.label}</td>
                            <td className="px-3 py-1.5 text-right"><M v={x.bank} /></td>
                            <td className="px-3 py-1.5 text-right"><M v={x.naqd} /></td>
                            <td className="px-3 py-1.5 text-right"><M v={x.total} /></td>
                        </tr>
                    ))}
            </Fragment>
        )
    }

    const allKirim = r ? sumLines(r.sections.flatMap((s) => s.kirim)) : null
    const allChiqim = r ? sumLines(r.sections.flatMap((s) => s.chiqim)) : null
    const hasData = r && (r.sections.some((s) => s.kirim.length || s.chiqim.length) || r.transfers.length > 0 || num(r.opening.total) !== 0)

    const diffText = (a: Amt) => {
        const parts = [`Bank: ${signed(a.bank)}`]
        if (a.naqd !== null) parts.push(`Naqd: ${signed(a.naqd)}`)
        return parts.join(", ")
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-base font-semibold">Pul oqimlari to'g'risida hisobot (Shakl №4)</h2>
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

            {isLoading && <div className="py-16 text-center text-sm text-muted-foreground">Yuklanmoqda...</div>}
            {isError && <div className="py-16 text-center text-sm text-destructive">Hisobotni yuklab bo'lmadi. Qayta urinib ko'ring.</div>}
            {r && !hasData && <div className="py-16 text-center text-sm text-muted-foreground">Bu oy uchun pul harakati topilmadi.</div>}

            {r && hasData && allKirim && allChiqim && (
                <>
                    {r.notes.length > 0 && (
                        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                            {r.notes.map((n, i) => (
                                <div key={i}>{n}</div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <Kpi icon={<Wallet size={14} />} label="Boshlang'ich qoldiq" value={r.opening.total} />
                        <Kpi icon={<ArrowUpCircle size={14} className="text-green-600" />} label="Kirim" value={allKirim.total} tone="text-green-600" />
                        <Kpi icon={<ArrowDownCircle size={14} className="text-destructive" />} label="Chiqim" value={allChiqim.total} />
                        <Kpi icon={<Wallet size={14} />} label="Oxirgi qoldiq" value={r.closing.total} />
                    </div>

                    <Card>
                        <CardContent className="overflow-x-auto p-0">
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
                                                    {i + 1}. {sec.label}
                                                </td>
                                            </tr>
                                            {sec.kirim.length > 0 && (
                                                <>
                                                    <tr className="border-b text-xs uppercase tracking-wide text-green-700">
                                                        <td colSpan={4} className="px-3 py-1 pl-6">Kirim (+)</td>
                                                    </tr>
                                                    {sec.kirim.map((l) => renderLine(l, `${sec.key}_in_${l.key}`))}
                                                    <Tot label="Jami kirim" a={sumLines(sec.kirim)} className="text-xs text-green-700" />
                                                </>
                                            )}
                                            {sec.chiqim.length > 0 && (
                                                <>
                                                    <tr className="border-b text-xs uppercase tracking-wide text-destructive">
                                                        <td colSpan={4} className="px-3 py-1 pl-6">Chiqim (−)</td>
                                                    </tr>
                                                    {sec.chiqim.map((l) => renderLine(l, `${sec.key}_out_${l.key}`))}
                                                    <Tot label="Jami chiqim" a={sumLines(sec.chiqim)} className="text-xs" />
                                                </>
                                            )}
                                            {sec.kirim.length === 0 && sec.chiqim.length === 0 && (
                                                <tr className="border-b text-xs text-muted-foreground">
                                                    <td colSpan={4} className="px-3 py-2 pl-6">Bu oy harakat yo'q</td>
                                                </tr>
                                            )}
                                            <Tot label="Sof pul oqimi" a={sec.net} className="bg-muted/40" />
                                        </Fragment>
                                    ))}
                                    {r.transfers.length > 0 && (
                                        <>
                                            <tr className="border-b">
                                                <td colSpan={4} className="bg-muted/20 px-3 py-2 font-semibold">
                                                    Ichki o'tkazmalar (Jami'da 0)
                                                </td>
                                            </tr>
                                            {r.transfers.map((l) => renderLine(l, `transfer_${l.key}`))}
                                        </>
                                    )}
                                    <Tot label="Davr uchun sof pul oqimi" a={r.net} className="bg-muted/40" />
                                    <Tot label="Davr oxiridagi pul qoldig'i" a={r.closing} className="bg-muted/60" />
                                    {r.check.ok ? (
                                        <tr className="bg-green-50 font-semibold text-green-700 dark:bg-green-950/30">
                                            <td className="px-3 py-2">
                                                <span className="flex items-center gap-1.5">
                                                    <CheckCircle2 size={16} />
                                                    Balans bilan solishtirish: mos ✓
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right"><M v={r.check.balance_closing.bank} /></td>
                                            <td className="px-3 py-2 text-right"><M v={r.check.balance_closing.naqd} /></td>
                                            <td className="px-3 py-2 text-right"><M v={r.check.balance_closing.total} /></td>
                                        </tr>
                                    ) : (
                                        <tr className="bg-amber-50 font-semibold text-amber-700 dark:bg-amber-950/30">
                                            <td className="px-3 py-2">
                                                <span className="flex items-center gap-1.5">
                                                    <AlertTriangle size={16} />
                                                    Balans bilan solishtirish: farq bor ({diffText(r.check.diff)})
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right"><M v={r.check.balance_closing.bank} /></td>
                                            <td className="px-3 py-2 text-right"><M v={r.check.balance_closing.naqd} /></td>
                                            <td className="px-3 py-2 text-right"><M v={r.check.balance_closing.total} /></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
