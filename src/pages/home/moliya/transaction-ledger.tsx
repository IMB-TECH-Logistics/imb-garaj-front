import { useState, useMemo, useEffect } from "react"
import { useSearch } from "@tanstack/react-router"
import { useGet } from "@/hooks/useGet"
import { FINANCE_CATEGORIES, FINANCE_LEDGER } from "@/constants/api-endpoints"
import { cn } from "@/lib/utils"
import { formatSom } from "@/lib/money-format"
import { useTheme } from "@/layouts/theme"

/** Backend uch qiymat qaytaradi (ML-04): kirim / chiqim / avans. */
type FlowType = "kirim" | "chiqim" | "avans"

type Transaction = {
    date: string
    description: string
    type: FlowType
    amount: number
    balance: number
    note: string
}

type LedgerItem = {
    id: number
    date: string
    description: string
    type: FlowType
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
/** Tavsifi bo'sh qatorlarni ham filtrlash mumkin bo'lishi uchun maxsus qiymat (ML-07). */
const EMPTY_DESC = "__empty__"

/** Qator turi → ekrandagi nishon (ML-04: avans endi "Chiqim" bo'lib yashirinmaydi). */
const TYPE_BADGE: Record<FlowType, { label: string; className: string }> = {
    kirim: { label: "Kirim", className: "text-emerald-500 bg-emerald-500/10" },
    chiqim: { label: "Chiqim", className: "text-red-500 bg-red-500/10" },
    avans: { label: "Avans", className: "text-amber-500 bg-amber-500/10" },
}

const fmt = formatSom
/** Butun son sifatida ko'rsatiladigan hisoblagichlar (yozuv soni, sahifa). */
const fmtCount = (v: number) => new Intl.NumberFormat("uz-UZ").format(v)

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
    const [typeFilter, setTypeFilter] = useState<"" | FlowType>("")
    const [page, setPage] = useState(1)
    const search: any = useSearch({ strict: false })

    const from_date = search?.from_date
    const to_date = search?.to_date
    const filterActive = Boolean(descFilter || typeFilter)

    // Sana oralig'i yoki filtr o'zgarsa har doim 1-sahifaga qaytamiz
    useEffect(() => {
        setPage(1)
    }, [from_date, to_date, descFilter, typeFilter])

    // ML-08: filtr endi SERVER tomonda (`description` / `type`). Ilgari butun
    // reyestr (page_size=100000) yuklanib mijoz tomonda kesilardi — endi shart
    // emas, va bu bilan avans qatorlari ham to'g'ri filtrlanadi.
    const ledgerQ = useGet<LedgerResponse>(FINANCE_LEDGER, {
        params: {
            from_date,
            to_date,
            description: descFilter || undefined,
            type: typeFilter || undefined,
            page,
            page_size: PAGE_SIZE,
        },
        // Sahifa almashganda oldingi javob saqlanib turadi. Busiz yangi sahifa
        // yuklanayotgan lahzada `total_pages` vaqtincha yo'qoladi va quyidagi
        // chegaralovchi effekt sahifani 1 ga qaytarib yuboradi.
        options: { placeholderData: (previous: any) => previous },
    })

    // "Tavsif" ro'yxati jadvalning yuklangan qatorlaridan emas, kategoriyalar
    // endpointidan olinadi — shunda oraliqdagi BARCHA kategoriyalar ko'rinadi (ML-07).
    const { data, isLoading, isError } = ledgerQ
    /**
     * R3: so'rov yetib bormasa `isError` yonmaydi va `data` `undefined`
     * bo'ladi — o'shanda "jami 0 ta" va "Ma'lumot topilmadi" YOLG'ON bo'ladi.
     */
    const ledgerOk = ledgerQ.isSuccess

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

    // "(Tavsifsiz)" tanlovi bir marta ko'ringach yo'qolib qolmasin: filtr
    // qo'llangandan keyin sahifada faqat o'sha qatorlar bo'ladi.
    const [sawEmptyDescription, setSawEmptyDescription] = useState(false)
    useEffect(() => {
        if (rows.some((r) => !r.description)) setSawEmptyDescription(true)
    }, [rows])
    const hasEmptyDescription =
        sawEmptyDescription || descFilter === EMPTY_DESC

    // Sahifalash va jami — SERVERDAN. Ko'rinadigan qatorlardan qayta
    // hisoblanmaydi (server bergan yig'indi ustun).
    const totalCount = data?.count ?? 0
    const totalPages = Math.max(1, data?.total_pages ?? 1)
    const visible = rows

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
                    {ledgerOk ? `jami ${fmtCount(totalCount)} ta` : "jami —"}
                    {totalPages > 1 && (
                        <span className="opacity-70">
                            {" "}
                            · {safePage}/{totalPages}-sahifa
                        </span>
                    )}
                </span>
                {/* ML-09: filtrlangan ko'rinishda Qoldiq ustuni monoton emas —
                    u butun oqim bo'yicha hisoblanadi va filtr faqat qaysi
                    qatorlar ko'rinishini tanlaydi. Buni ochiq aytmasak ustun
                    "buzuq" bo'lib ko'rinadi. */}
                {filterActive && (
                    <span
                        className="text-[10px] text-amber-600 dark:text-amber-500 whitespace-nowrap"
                        title="Qoldiq ustuni har doim BUTUN kassa oqimi bo'yicha yugurib boradi — filtrlanmagan qatorlar ham unga ta'sir qiladi. Shuning uchun filtr ostida qo'shni qatorlar orasidagi farq ko'rinayotgan miqdorga teng bo'lmasligi mumkin."
                    >
                        · Qoldiq — butun oqim bo'yicha
                    </span>
                )}
            </div>
            {/* Uzun izohli qatorlar ustunlarni siqib qo'ymasligi uchun jadval
                o'z ichida gorizontal suriladi (panel yarim ekran kengligida). */}
            <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
                <table className="w-full min-w-[640px] text-xs">
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
                                        typeFilter === "avans" && "border-amber-500/30 bg-amber-500/10 text-amber-500 font-semibold",
                                        !typeFilter && "border-border bg-secondary text-muted-foreground font-medium hover:border-primary/20",
                                    )}
                                >
                                    <option value="">Tur</option>
                                    <option value="kirim">Kirim</option>
                                    <option value="chiqim">Chiqim</option>
                                    {/* ML-04: avans alohida tur — ilgari "Chiqim"
                                        filtri ostida ham ko'rinmay yo'qolardi */}
                                    <option value="avans">Avans</option>
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
                        {!isLoading && !isError && !ledgerOk && (
                            <tr>
                                <td colSpan={colSpan} className="px-4 py-10 text-center text-amber-600 dark:text-amber-500">
                                    Ma'lumot kelmadi
                                    <span className="block text-[10px] text-muted-foreground mt-1">
                                        Server javob bermadi — bu yozuv yo'q
                                        degani EMAS.
                                    </span>
                                </td>
                            </tr>
                        )}

                        {!isLoading && !isError && ledgerOk && visible.length === 0 && (
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
                                            (TYPE_BADGE[tx.type] ?? TYPE_BADGE.chiqim).className,
                                        )}
                                    >
                                        {(TYPE_BADGE[tx.type] ?? TYPE_BADGE.chiqim).label}
                                    </span>
                                </td>
                                <td
                                    className={cn(
                                        "px-2 py-2.5 text-right font-semibold whitespace-nowrap",
                                        tx.type === "kirim" ? "text-emerald-500"
                                        : tx.type === "avans" ? "text-amber-500"
                                        : "text-red-500",
                                        // YANGI-07: 0.00 miqdorli qator qoldiqni umuman
                                        // o'zgartirmaydi — u shovqin, shuning uchun so'niq.
                                        !tx.amount && "opacity-50 font-normal",
                                    )}
                                    title={
                                        !tx.amount ?
                                            "Miqdori 0 — bu yozuv qoldiqni o'zgartirmaydi"
                                        :   undefined
                                    }
                                >
                                    {/* YANGI-07: miqdori nol qatorda "−0" emas, oddiy "0" */}
                                    {tx.amount ?
                                        `${tx.type === "kirim" ? "+" : "−"}${fmt(tx.amount)}`
                                    :   "0"}
                                </td>
                                <td className="px-2 py-2.5 text-right font-medium whitespace-nowrap">{fmt(tx.balance)}</td>
                                {/* Uzun izoh ustunni siqib, harflarni ustma-ust
                                    tashlab yuborardi — endi kesiladi, to'lig'i
                                    tooltipda. */}
                                <td className="px-4 py-2.5 text-muted-foreground">
                                    <div
                                        className="max-w-[180px] truncate"
                                        title={tx.note || undefined}
                                    >
                                        {tx.note || "—"}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Sahifalash — ilgari umuman yo'q edi, 1714 yozuvdan 500 tasi ko'rinardi (ML-03) */}
            {totalPages > 1 && (
                <div className="shrink-0 flex items-center justify-between gap-2 border-t border-border px-4 py-2">
                    <span className="text-[10px] text-muted-foreground">
                        {fmtCount((safePage - 1) * PAGE_SIZE + (visible.length ? 1 : 0))}–
                        {fmtCount((safePage - 1) * PAGE_SIZE + visible.length)} / {fmtCount(totalCount)}
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
