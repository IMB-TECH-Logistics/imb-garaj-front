import { useState, useMemo, useEffect } from "react"
import { useSearch } from "@tanstack/react-router"
import { useGet } from "@/hooks/useGet"
import { FINANCE_CATEGORIES, FINANCE_LEDGER } from "@/constants/api-endpoints"
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

type CategoryNode = {
    id: string
    label: string
    value: string | number
    children?: CategoryNode[]
}

const PAGE_SIZE = 50
/** Filtrlash server tomonda qo'llab-quvvatlanmagani uchun (backend-kerak/F1.md: ML-08)
 *  filtr yoqilganda butun reyestr bir marta yuklanadi va mijoz tomonda sahifalanadi.
 *  Shunda filtr natijasi 1714 yozuvning HAMMASI ustidan hisoblanadi, kesilgan qism emas. */
const ALL_ROWS_PAGE_SIZE = 100000
/** Tavsifi bo'sh qatorlarni ham filtrlash mumkin bo'lishi uchun maxsus qiymat (ML-07). */
const EMPTY_DESC = "__empty__"

const fmt = (v: number) => new Intl.NumberFormat("uz-UZ").format(v)

const formatDate = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return "—"
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export default function TransactionLedger() {
    const { theme } = useTheme()
    const scheme = theme === "dark" ? "dark" : "light"
    const [descFilter, setDescFilter] = useState<string>("")
    const [typeFilter, setTypeFilter] = useState<"" | "kirim" | "chiqim">("")
    const [page, setPage] = useState(1)
    const search: any = useSearch({ strict: false })

    const from_date = search?.from_date
    const to_date = search?.to_date
    const filterActive = Boolean(descFilter || typeFilter)

    // Sana oralig'i yoki filtr o'zgarsa har doim 1-sahifaga qaytamiz
    useEffect(() => {
        setPage(1)
    }, [from_date, to_date, descFilter, typeFilter])

    const { data, isLoading, isError } = useGet<LedgerResponse>(FINANCE_LEDGER, {
        params: {
            from_date,
            to_date,
            // Filtr yoqilganda hamma qator kerak (mijoz tomonda filtrlanadi),
            // aks holda oddiy server sahifalash ishlaydi.
            page: filterActive ? 1 : page,
            page_size: filterActive ? ALL_ROWS_PAGE_SIZE : PAGE_SIZE,
        },
        // Sahifa almashganda oldingi javob saqlanib turadi. Busiz yangi sahifa
        // yuklanayotgan lahzada `total_pages` vaqtincha yo'qoladi va quyidagi
        // chegaralovchi effekt sahifani 1 ga qaytarib yuboradi.
        options: { placeholderData: (previous: any) => previous },
    })

    // "Tavsif" ro'yxati jadvalning yuklangan qatorlaridan emas, kategoriyalar
    // endpointidan olinadi — shunda oraliqdagi BARCHA kategoriyalar ko'rinadi (ML-07).
    const { data: incomeCats } = useGet<CategoryNode>(FINANCE_CATEGORIES, {
        params: { type: "tushum", from_date, to_date },
    })
    const { data: expenseCats } = useGet<CategoryNode>(FINANCE_CATEGORIES, {
        params: { type: "xarajat", from_date, to_date },
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

    const DESCRIPTIONS = useMemo(() => {
        const names = new Set<string>()
        for (const node of [incomeCats, expenseCats]) {
            for (const child of node?.children ?? []) {
                if (child.label) names.add(child.label)
            }
        }
        // Kategoriyalar hali yuklanmagan bo'lsa hech bo'lmasa joriy qatorlardan to'ldiramiz
        if (!names.size) {
            for (const r of rows) if (r.description) names.add(r.description)
        }
        return [...names].sort((a, b) => a.localeCompare(b))
    }, [incomeCats, expenseCats, rows])

    const hasEmptyDescription = useMemo(
        () => rows.some((r) => !r.description),
        [rows],
    )

    const filteredAll = useMemo(() => {
        if (!filterActive) return rows
        return rows.filter((tx) => {
            if (descFilter === EMPTY_DESC) {
                if (tx.description) return false
            } else if (descFilter && tx.description !== descFilter) {
                return false
            }
            if (typeFilter && tx.type !== typeFilter) return false
            return true
        })
    }, [rows, descFilter, typeFilter, filterActive])

    // Filtrlangan holatda sahifalash mijoz tomonda, aks holda serverdan keladi
    const totalCount = filterActive ? filteredAll.length : (data?.count ?? 0)
    const totalPages =
        filterActive ?
            Math.max(1, Math.ceil(filteredAll.length / PAGE_SIZE))
        :   Math.max(1, data?.total_pages ?? 1)

    const visible = useMemo(() => {
        if (!filterActive) return filteredAll
        const start = (page - 1) * PAGE_SIZE
        return filteredAll.slice(start, start + PAGE_SIZE)
    }, [filteredAll, filterActive, page])

    const safePage = Math.min(page, totalPages)
    useEffect(() => {
        // Faqat haqiqiy javob kelganda chegaralaymiz — yuklanish paytida emas
        if (data && page > totalPages) setPage(totalPages)
    }, [data, page, totalPages])

    const colSpan = 6

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* pr-24 — o'ng yuqoridagi kengaytirish/sana tugmalari hisoblagichni bosib
                qolmasligi uchun (ML-05) */}
            <div className="px-4 pt-3 pb-2 shrink-0 flex items-center gap-2 pr-24">
                <h3 className="text-xs font-semibold whitespace-nowrap">
                    Kirim-Chiqim tarixi
                </h3>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {/* Jami yozuvlar soni — yuklangan qatorlar soni emas (ML-06) */}
                    jami {fmt(totalCount)} ta
                    {totalPages > 1 && (
                        <span className="opacity-70">
                            {" "}
                            · {safePage}/{totalPages}-sahifa
                        </span>
                    )}
                </span>
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
                                    {hasEmptyDescription && (
                                        <option value={EMPTY_DESC}>(Tavsifsiz)</option>
                                    )}
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
                            <th
                                className="text-right font-medium text-muted-foreground px-2 py-2"
                                title="Umumiy kassa oqimi bo'yicha yugurib boruvchi qoldiq — filtrdan qat'i nazar shu tranzaksiyadan keyingi holat"
                            >
                                Qoldiq
                            </th>
                            <th className="text-left font-medium text-muted-foreground px-4 py-2">Izoh</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr>
                                <td colSpan={colSpan} className="px-4 py-10 text-center text-muted-foreground">
                                    Yuklanmoqda...
                                </td>
                            </tr>
                        )}

                        {!isLoading && isError && (
                            <tr>
                                <td colSpan={colSpan} className="px-4 py-10 text-center text-red-500">
                                    Ma'lumotni yuklab bo'lmadi. Keyinroq qayta urinib ko'ring.
                                </td>
                            </tr>
                        )}

                        {/* Bo'sh holat xabari — ilgari faqat bo'sh sarlavha qatori qolardi (ML-17) */}
                        {!isLoading && !isError && visible.length === 0 && (
                            <tr>
                                <td colSpan={colSpan} className="px-4 py-10 text-center text-muted-foreground">
                                    Ma'lumot topilmadi
                                    {(filterActive || from_date || to_date) && (
                                        <span className="block text-[10px] opacity-70 mt-1">
                                            Tanlangan sana oralig'i yoki filtr bo'yicha yozuv yo'q
                                        </span>
                                    )}
                                </td>
                            </tr>
                        )}

                        {visible.map((tx, i) => (
                            <tr
                                key={i}
                                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                                <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{tx.date}</td>
                                <td className="px-2 py-2.5 font-medium">{tx.description || "—"}</td>
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
                                <td className="px-4 py-2.5 text-muted-foreground">{tx.note || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Sahifalash — ilgari umuman yo'q edi, 1714 yozuvdan 500 tasi ko'rinardi (ML-03) */}
            {totalPages > 1 && (
                <div className="shrink-0 flex items-center justify-between gap-2 border-t border-border px-4 py-2">
                    <span className="text-[10px] text-muted-foreground">
                        {fmt((safePage - 1) * PAGE_SIZE + (visible.length ? 1 : 0))}–
                        {fmt((safePage - 1) * PAGE_SIZE + visible.length)} / {fmt(totalCount)}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setPage(1)}
                            disabled={safePage <= 1}
                            className="h-6 min-w-6 px-1.5 rounded-md border text-[11px] disabled:opacity-40 hover:bg-muted transition-colors"
                        >
                            «
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={safePage <= 1}
                            className="h-6 min-w-6 px-1.5 rounded-md border text-[11px] disabled:opacity-40 hover:bg-muted transition-colors"
                        >
                            ‹
                        </button>
                        <span className="text-[11px] tabular-nums px-1">
                            {safePage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={safePage >= totalPages}
                            className="h-6 min-w-6 px-1.5 rounded-md border text-[11px] disabled:opacity-40 hover:bg-muted transition-colors"
                        >
                            ›
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage(totalPages)}
                            disabled={safePage >= totalPages}
                            className="h-6 min-w-6 px-1.5 rounded-md border text-[11px] disabled:opacity-40 hover:bg-muted transition-colors"
                        >
                            »
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
