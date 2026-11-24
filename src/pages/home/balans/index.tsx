import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { usePatch } from "@/hooks/usePatch"
import { cn } from "@/lib/utils"
import { amountText, num, onApiError } from "@/pages/home/kontragent/api"
import { useQueryClient } from "@tanstack/react-query"
import { addMonths, format, startOfMonth } from "date-fns"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Fragment, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

const URL = "kontragent/balance-sheet"

type Money = string | number | null
type Detail = { id?: number; label: string; amount: Money; bank?: Money; naqd?: Money; other?: Money }
type Row = {
    key: string
    label: string
    source: string
    bank: Money
    naqd: Money
    total: Money
    manual: boolean
    note: string
    details: Detail[]
}
type Totals = { bank: Money; naqd: Money; total: Money }
type Section = { rows: Row[]; total: Totals }
type Sheet = {
    date: string
    until: string
    aktiv: Section
    majburiyat: Section
    kapital: Totals & { nominal: Money }
    bank_to_cash: Money
    expected_equity: Money
    difference: Money
}

const M = ({ v, strong }: { v: Money; strong?: boolean }) =>
    v === null || v === undefined ? (
        <span className="text-muted-foreground">—</span>
    ) : (
        <span
            className={cn(
                "tabular-nums whitespace-nowrap",
                strong && "font-semibold",
                num(v) < 0 && "text-destructive",
            )}
        >
            {num(v) < 0 ? "−" : ""}
            {amountText(Math.abs(num(v)))}
        </span>
    )

const ManualCell = ({
    row,
    field,
    date,
    canEdit,
}: {
    row: Row
    field: "bank" | "naqd" | "other"
    date: string
    canEdit: boolean
}) => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const other = num(row.total) - num(row.bank) - num(row.naqd)
    const initial = field === "other" ? other : num(row[field])
    const [value, setValue] = useState(String(initial || ""))
    useEffect(() => setValue(String(initial || "")), [initial])
    const { mutate } = usePatch({
        onSuccess: () => {
            qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith(URL) })
            toast.success(t("balans.saved"))
        },
        onError: onApiError(t("messages.error")),
    })
    if (!canEdit) return <M v={initial} />
    const save = () => {
        if (num(value) === initial) return
        mutate(URL, {
            date,
            values: {
                [row.key]: {
                    bank: field === "bank" ? value || 0 : row.bank || 0,
                    naqd: field === "naqd" ? value || 0 : row.naqd || 0,
                    other: field === "other" ? value || 0 : 0,
                    note: row.note,
                },
            },
        })
    }
    return (
        <Input
            fullWidth
            wrapperClassName="h-8"
            className="h-8 w-full min-w-0 px-2 text-right text-sm tabular-nums"
            inputMode="decimal"
            value={value}
            placeholder="0"
            onChange={(e) => setValue(e.target.value.replace(/[^\d.-]/g, ""))}
            onBlur={save}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
    )
}

const SectionTable = ({
    title,
    section,
    date,
    canEdit,
}: {
    title: string
    section: Section
    date: string
    canEdit: boolean
}) => {
    const { t } = useTranslation()
    const [open, setOpen] = useState<Record<string, boolean>>({})
    return (
        <Card>
            <CardContent className="p-0 overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                    <colgroup>
                        <col />
                        <col className="w-[21%]" />
                        <col className="w-[21%]" />
                        <col className="w-[23%]" />
                    </colgroup>
                    <thead>
                        <tr className="border-b bg-muted/40 text-muted-foreground">
                            <th className="text-left font-medium px-3 py-2">{title}</th>
                            <th className="text-right font-medium px-3 py-2">{t("balans.bank")}</th>
                            <th className="text-right font-medium px-3 py-2">{t("balans.naqd")}</th>
                            <th className="text-right font-medium px-3 py-2">{t("balans.jami")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {section.rows.map((r) => {
                            const has = r.details.length > 0
                            const isOpen = open[r.key]
                            return (
                                <Fragment key={r.key}>
                                    <tr
                                        className={cn("border-b", has && "cursor-pointer hover:bg-muted/30")}
                                        onClick={() => has && setOpen((o) => ({ ...o, [r.key]: !o[r.key] }))}
                                    >
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                {has ? (
                                                    isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />
                                                ) : (
                                                    <span className="w-[15px]" />
                                                )}
                                                <div className="min-w-0">
                                                    <div className={cn("leading-snug", r.manual && "text-muted-foreground")}>{r.label}</div>
                                                    <div className="text-xs text-muted-foreground truncate" title={r.source}>{r.source}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {r.manual ? (
                                            <>
                                                <td className="px-1.5 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <ManualCell row={r} field="bank" date={date} canEdit={canEdit} />
                                                </td>
                                                <td className="px-1.5 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <ManualCell row={r} field="naqd" date={date} canEdit={canEdit} />
                                                </td>
                                                <td className="px-3 py-2 text-right"><M v={r.total} strong /></td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-3 py-2 text-right"><M v={r.bank} /></td>
                                                <td className="px-3 py-2 text-right"><M v={r.naqd} /></td>
                                                <td className="px-3 py-2 text-right"><M v={r.total} strong /></td>
                                            </>
                                        )}
                                    </tr>
                                    {isOpen &&
                                        r.details.map((d, i) => (
                                            <tr key={i} className="border-b bg-muted/20 text-xs">
                                                <td className="py-1.5 pl-9 pr-3 truncate" title={d.label}>{d.label}</td>
                                                <td className="py-2 px-3 text-right">{d.bank !== undefined ? <M v={d.bank} /> : null}</td>
                                                <td className="py-2 px-3 text-right">{d.naqd !== undefined ? <M v={d.naqd} /> : null}</td>
                                                <td className="py-2 px-3 text-right"><M v={d.amount} /></td>
                                            </tr>
                                        ))}
                                </Fragment>
                            )
                        })}
                        <tr className="bg-muted/40 font-semibold">
                            <td className="px-3 py-2">{t("balans.total")}</td>
                            <td className="px-3 py-2 text-right"><M v={section.total.bank} strong /></td>
                            <td className="px-3 py-2 text-right"><M v={section.total.naqd} strong /></td>
                            <td className="px-3 py-2 text-right"><M v={section.total.total} strong /></td>
                        </tr>
                    </tbody>
                </table>
            </CardContent>
        </Card>
    )
}

const thisMonth = () => format(startOfMonth(new Date()), "yyyy-MM-dd")

export default function BalancePage() {
    const { t } = useTranslation()
    const canEdit = useHasAction("fin_report_control")
    const [date, setDate] = useState(thisMonth)
    const shift = (n: number) => setDate(format(addMonths(startOfMonth(new Date(date)), n), "yyyy-MM-dd"))
    const { data, isLoading, isError } = useGet<Sheet>(URL, { params: { date } })
    const diff = data?.difference
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="text-sm text-muted-foreground">{t("balans.subtitle")}</p>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center rounded-md border">
                        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => shift(-1)} title={t("balans.prev_month")}>
                            <ChevronLeft size={16} />
                        </Button>
                        <Input type="date" wrapperClassName="h-9 w-36" className="h-9 border-0 shadow-none text-center focus-visible:ring-0" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
                        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => shift(1)} title={t("balans.next_month")}>
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                    <Button size="sm" variant="outline" className="h-9" onClick={() => setDate(thisMonth())}>
                        {t("balans.this_month")}
                    </Button>
                    
                </div>
            </div>

            {isError ? (
                <Card><CardContent className="p-6 text-destructive">{t("messages.error")}</CardContent></Card>
            ) : isLoading || !data ? (
                <Card><CardContent className="p-6 text-muted-foreground">…</CardContent></Card>
            ) : (
                <>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Card><CardContent className="p-4">
                            <div className="text-xs text-muted-foreground">{t("balans.aktiv")}</div>
                            <div className="text-lg"><M v={data.aktiv.total.total} strong /></div>
                        </CardContent></Card>
                        <Card><CardContent className="p-4">
                            <div className="text-xs text-muted-foreground">{t("balans.majburiyat")}</div>
                            <div className="text-lg"><M v={data.majburiyat.total.total} strong /></div>
                        </CardContent></Card>
                        <Card className={cn(diff !== null && num(diff) !== 0 && "border-destructive")}><CardContent className="p-4">
                            <div className="text-xs text-muted-foreground">{t("balans.kapital_formula")}</div>
                            <div className="text-lg"><M v={data.kapital.total} strong /></div>
                            <div className="text-xs text-muted-foreground">{t("balans.kapital_cash", { rate: num(data.bank_to_cash) * 100 })}</div>
                        </CardContent></Card>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2 items-start">
                        <SectionTable title={t("balans.aktiv_long")} section={data.aktiv} date={date} canEdit={canEdit} />
                        <SectionTable title={t("balans.majburiyat_long")} section={data.majburiyat} date={date} canEdit={canEdit} />
                    </div>

                    <Card>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b font-semibold">
                                        <td className="px-3 py-2">
                                            <div>{t("balans.kapital_formula")}</div>
                                            <div className="text-xs font-normal text-muted-foreground">{t("balans.kapital_cash", { rate: num(data.bank_to_cash) * 100 })}</div>
                                        </td>
                                        <td className="p-3 text-right w-40"><M v={data.kapital.bank} strong /></td>
                                        <td className="p-3 text-right w-40"><M v={data.kapital.naqd} strong /></td>
                                        <td className="p-3 text-right w-44"><M v={data.kapital.total} strong /></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="px-3 py-2">
                                            <div>{t("balans.expected")}</div>
                                            <div className="text-xs text-muted-foreground">{t("balans.expected_hint")}</div>
                                        </td>
                                        <td />
                                        <td />
                                        <td className="px-1.5 py-1.5 text-right">
                                            <ManualCell
                                                row={{ key: "expected_equity", label: "", source: "", bank: null, naqd: null, total: data.expected_equity ?? 0, manual: true, note: "", details: [] }}
                                                field="other"
                                                date={date}
                                                canEdit={canEdit}
                                            />
                                        </td>
                                    </tr>
                                    <tr className={cn("font-semibold", diff !== null && num(diff) !== 0 ? "text-destructive" : "text-green-600")}>
                                        <td className="px-3 py-2">{t("balans.difference")}</td>
                                        <td />
                                        <td />
                                        <td className="px-3 py-2 text-right">
                                            {diff === null ? <span className="text-muted-foreground font-normal">{t("balans.no_expected")}</span> : <M v={diff ?? null} strong />}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
