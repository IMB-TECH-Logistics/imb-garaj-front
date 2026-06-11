import { useState, useMemo } from "react"
import { useSearch } from "@tanstack/react-router"
import { useGet } from "@/hooks/useGet"
import { FINANCE_LEDGER } from "@/constants/api-endpoints"
import { cn } from "@/lib/utils"
import { useTheme } from "@/layouts/theme"

type Transaction = {
    date: string
    description: string
    type: "kirim" | "chiqim"
    amount: number
    balance: number
    note: string
}

type LedgerItem = {
    id: number
    date: string
    description: string
    type: "kirim" | "chiqim"
    amount: string | number
    balance: string | number
    note: string
}

type LedgerResponse = {
    count: number
    total_pages: number
    page_size: number
    results: LedgerItem[]
}

const fmt = (v: number) => new Intl.NumberFormat("uz-UZ").format(v)

const formatDate = (iso: string) => {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export default function TransactionLedger() {
    const { theme } = useTheme()
    const scheme = theme === "dark" ? "dark" : "light"
    const [descFilter, setDescFilter] = useState<string>("")
    const [typeFilter, setTypeFilter] = useState<"" | "kirim" | "chiqim">("")
    const search: any = useSearch({ strict: false })

    const { data } = useGet<LedgerResponse>(FINANCE_LEDGER, {
        params: { from_date: search?.from_date, to_date: search?.to_date, page_size: 500 },
    })

    const rows: Transaction[] = useMemo(
        () =>
            (data?.results ?? []).map((r) => ({
                date: formatDate(r.date),
                description: r.description,
                type: r.type,
                amount: Number(r.amount),
                balance: Number(r.balance),
                note: r.note,
            })),
        [data],
    )

    const DESCRIPTIONS = useMemo(
        () => [...new Set(rows.map((t) => t.description).filter(Boolean))],
        [rows],
    )

    const filtered = useMemo(() => {
        return rows.filter((tx) => {
            if (descFilter && tx.description !== descFilter) return false
            if (typeFilter && tx.type !== typeFilter) return false
            return true
        })
    }, [rows, descFilter, typeFilter])

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="px-4 pt-3 pb-2 shrink-0 flex items-center justify-between">
                <h3 className="text-xs font-semibold">Kirim-Chiqim tarixi</h3>
                <span className="text-[10px] text-muted-foreground">{filtered.length} ta</span>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
                <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="border-b border-border">
                            <th className="text-left font-medium text-muted-foreground px-4 py-2">Sana</th>
                            <th className="text-left px-2 py-1.5">
                                <select
                                    value={descFilter}
                                    onChange={(e) => setDescFilter(e.target.value)}
                                    style={{ colorScheme: scheme }}
                                    className={cn(
                                        "h-7 rounded-lg px-2.5 pr-6 text-[11px] outline-none cursor-pointer transition-all",
                                        "border shadow-sm",
                                        descFilter
                                            ? "border-primary/30 bg-primary/10 text-foreground font-semibold"
                                            : "border-border bg-secondary text-muted-foreground font-medium hover:border-primary/20",
                                    )}
                                >
                                    <option value="">Tavsif</option>
                                    {DESCRIPTIONS.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </th>
                            <th className="text-left px-2 py-1.5">
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value as any)}
                                    style={{ colorScheme: scheme }}
                                    className={cn(
                                        "h-7 rounded-lg px-2.5 pr-6 text-[11px] outline-none cursor-pointer transition-all",
                                        "border shadow-sm",
                                        typeFilter === "kirim" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-semibold",
                                        typeFilter === "chiqim" && "border-red-500/30 bg-red-500/10 text-red-500 font-semibold",
                                        !typeFilter && "border-border bg-secondary text-muted-foreground font-medium hover:border-primary/20",
                                    )}
                                >
                                    <option value="">Tur</option>
                                    <option value="kirim">Kirim</option>
                                    <option value="chiqim">Chiqim</option>
                                </select>
                            </th>
                            <th className="text-right font-medium text-muted-foreground px-2 py-2">Miqdor</th>
                            <th className="text-right font-medium text-muted-foreground px-2 py-2">Qoldiq</th>
                            <th className="text-left font-medium text-muted-foreground px-4 py-2">Izoh</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((tx, i) => (
                            <tr
                                key={i}
                                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                                <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{tx.date}</td>
                                <td className="px-2 py-2.5 font-medium">{tx.description}</td>
                                <td className="px-2 py-2.5">
                                    <span
                                        className={cn(
                                            "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                                            tx.type === "kirim"
                                                ? "text-emerald-500 bg-emerald-500/10"
                                                : "text-red-500 bg-red-500/10",
                                        )}
                                    >
                                        {tx.type === "kirim" ? "Kirim" : "Chiqim"}
                                    </span>
                                </td>
                                <td
                                    className={cn(
                                        "px-2 py-2.5 text-right font-semibold whitespace-nowrap",
                                        tx.type === "kirim" ? "text-emerald-500" : "text-red-500",
                                    )}
                                >
                                    {tx.type === "kirim" ? "+" : "−"}{fmt(tx.amount)}
                                </td>
                                <td className="px-2 py-2.5 text-right font-medium whitespace-nowrap">{fmt(tx.balance)}</td>
                                <td className="px-4 py-2.5 text-muted-foreground">{tx.note}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
