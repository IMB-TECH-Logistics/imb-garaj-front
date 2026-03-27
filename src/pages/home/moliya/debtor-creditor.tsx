import { cn } from "@/lib/utils"

type Entry = { name: string; amount: number; days: number; note?: string }

const DEBTORS: Entry[] = [
    { name: "Artel Group", amount: 12_500_000, days: 15, note: "Mart shartnomasi" },
    { name: "Nestle Uzbekistan", amount: 8_200_000, days: 7, note: "Yuk tashish" },
    { name: "Coca-Cola", amount: 4_800_000, days: 32, note: "Fevral qoldig'i" },
    { name: "Korzinka", amount: 3_100_000, days: 3, note: "Express yetkazish" },
    { name: "Makro", amount: 6_700_000, days: 22, note: "Ombor xizmati" },
]

const CREDITORS: Entry[] = [
    { name: "Yoqilg'i bazasi", amount: 7_400_000, days: 10, note: "Diesel uchun" },
    { name: "Shina do'koni", amount: 3_200_000, days: 5, note: "4ta shina" },
    { name: "Mexanik ustaxona", amount: 2_100_000, days: 18, note: "Dvigatel ta'miri" },
    { name: "OSAGO sug'urta", amount: 1_800_000, days: 45, note: "Yillik sug'urta" },
]

const fmt = (v: number) => new Intl.NumberFormat("uz-UZ").format(v)

function StatusDot({ days }: { days: number }) {
    return (
        <span
            className={cn(
                "size-2 rounded-full shrink-0",
                days > 30 ? "bg-red-500" : days > 14 ? "bg-amber-500" : "bg-emerald-500",
            )}
            title={`${days} kun`}
        />
    )
}

function EntryList({ entries, variant }: { entries: Entry[]; variant: "income" | "expense" }) {
    const total = entries.reduce((s, e) => s + e.amount, 0)
    const isIncome = variant === "income"
    return (
        <div className="h-full flex flex-col">
            <div className="px-4 pt-3 pb-[17px] shrink-0 border-b flex items-center gap-3">
                <h3 className="text-xs font-semibold">{isIncome ? "Bizga berishlari kerak" : "Biz berishimiz kerak"}</h3>
                <span className={cn("text-xs font-semibold", isIncome ? "text-emerald-500" : "text-red-500")}>
                    {isIncome ? "+" : "−"}{fmt(total)}
                </span>
            </div>
            <div className="flex-1 overflow-y-auto">
                {entries.map((e, i) => (
                    <div key={i} className="px-4 py-2 border-b border-border/40 hover:bg-muted/30 transition-colors flex items-start gap-2">
                        <StatusDot days={e.days} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium truncate">{e.name}</span>
                                <span className={cn("text-xs font-semibold shrink-0", isIncome ? "text-emerald-500" : "text-red-500")}>
                                    {isIncome ? "+" : "−"}{fmt(e.amount)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                                <span className="text-[10px] text-muted-foreground">{e.note}</span>
                                <span className={cn(
                                    "text-[10px] font-medium",
                                    e.days > 30 ? "text-red-500" : e.days > 14 ? "text-amber-500" : "text-muted-foreground",
                                )}>{e.days} kun</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function DebtorCard() {
    return <EntryList entries={DEBTORS} variant="income" />
}

export function CreditorCard() {
    return <EntryList entries={CREDITORS} variant="expense" />
}

export default function DebtorCreditor() {
    return (
        <div className="grid grid-cols-2 gap-3 h-full">
            <DebtorCard />
            <CreditorCard />
        </div>
    )
}
