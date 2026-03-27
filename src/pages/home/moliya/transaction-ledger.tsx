import { useState, useMemo } from "react"
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

const TRANSACTIONS: Transaction[] = [
    { date: "01.03.2026", description: "Oylik maosh", type: "kirim", amount: 5_000_000, balance: 5_000_000, note: "Fevral oyi uchun" },
    { date: "02.03.2026", description: "Yoqilg'i xarajati", type: "chiqim", amount: 350_000, balance: 4_650_000, note: "Diesel AI-92" },
    { date: "03.03.2026", description: "Yo'l to'lovi", type: "chiqim", amount: 200_000, balance: 4_450_000, note: "Toshkent—Samarqand" },
    { date: "05.03.2026", description: "Yuk tashish", type: "kirim", amount: 3_200_000, balance: 7_650_000, note: "Buxoro reysi" },
    { date: "06.03.2026", description: "Shinalar almashtirish", type: "chiqim", amount: 1_800_000, balance: 5_850_000, note: "Old 2ta shina" },
    { date: "08.03.2026", description: "Shartnoma to'lov", type: "kirim", amount: 4_500_000, balance: 10_350_000, note: "Artel — oylik" },
    { date: "10.03.2026", description: "Mexanik ish haqi", type: "chiqim", amount: 2_000_000, balance: 8_350_000, note: "Mart oyi" },
    { date: "12.03.2026", description: "Farg'ona yuk", type: "kirim", amount: 2_800_000, balance: 11_150_000, note: "Yuk tashish xizmati" },
    { date: "14.03.2026", description: "Moy almashtirish", type: "chiqim", amount: 450_000, balance: 10_700_000, note: "Dvigatel moyi" },
    { date: "15.03.2026", description: "Avans", type: "kirim", amount: 1_500_000, balance: 12_200_000, note: "Haydovchiga avans" },
    { date: "18.03.2026", description: "Parkovka", type: "chiqim", amount: 120_000, balance: 12_080_000, note: "Toshkent markazi" },
    { date: "20.03.2026", description: "Nestle shartnoma", type: "kirim", amount: 6_000_000, balance: 18_080_000, note: "Oylik shartnoma" },
    { date: "22.03.2026", description: "Haydovchi maoshi", type: "chiqim", amount: 3_500_000, balance: 14_580_000, note: "Mart oyi" },
    { date: "25.03.2026", description: "Express yetkazish", type: "kirim", amount: 1_200_000, balance: 15_780_000, note: "Farg'ona—Toshkent" },
]

const fmt = (v: number) => new Intl.NumberFormat("uz-UZ").format(v)

const DESCRIPTIONS = [...new Set(TRANSACTIONS.map((t) => t.description))]

export default function TransactionLedger() {
    const { theme } = useTheme()
    const scheme = theme === "dark" ? "dark" : "light"
    const [descFilter, setDescFilter] = useState<string>("")
    const [typeFilter, setTypeFilter] = useState<"" | "kirim" | "chiqim">("")

    const filtered = useMemo(() => {
        return TRANSACTIONS.filter((tx) => {
            if (descFilter && tx.description !== descFilter) return false
            if (typeFilter && tx.type !== typeFilter) return false
            return true
        })
    }, [descFilter, typeFilter])

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
