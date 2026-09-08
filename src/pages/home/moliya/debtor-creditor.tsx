import { useMemo } from "react"
import { useSearch } from "@tanstack/react-router"
import { useGet } from "@/hooks/useGet"
import { FINANCE_DEBTORS, FINANCE_CREDITORS } from "@/constants/api-endpoints"
import { cn } from "@/lib/utils"
import { formatSom } from "@/lib/money-format"
import { queryErrorHint, queryErrorMessage } from "@/lib/query-state"

type Entry = { name: string; amount: number; days: number; note?: string }

type PartnerItem = {
    id: number
    name: string
    amount: string | number
    days: number
    note: string
}
type PartnerResponse = { results: PartnerItem[]; total: string | number }

/**
 * QARZDORLAR / KREDITORLAR paneli.
 *
 * ⚠ Ilgari bu faylda `DEFAULT_DEBTORS` / `DEFAULT_CREDITORS` degan "vaqtinchalik"
 * qattiq yozilgan ro'yxat bor edi va API bo'sh natija qaytarganda ham ekranga
 * o'sha chiziladi: haqiqiy mijoz nomlari bilan +689 063 721 so'mlik UYDIRMA qarz.
 * Ya'ni 2030-yil oralig'ida API `{"results":[],"total":"0.00"}` qaytarsa ham
 * panel to'la ma'lumot ko'rsatardi. Pul haqida uydirma raqam — eng zararli xato
 * turi, shuning uchun soxta default BUTUNLAY olib tashlandi.
 *
 * Endi uchta holat aniq ajratilgan:
 *   * so'rov ketyapti  → "Yuklanmoqda..."
 *   * so'rov yiqildi   → sababi (403 bo'lsa "Ruxsat yo'q"), raqam emas
 *   * natija bo'sh     → "Ma'lumot yo'q", jami 0
 */
function usePartners(url: string) {
    const search: any = useSearch({ strict: false })
    const { data, isLoading, isError, error } = useGet<PartnerResponse>(url, {
        params: { from_date: search?.from_date, to_date: search?.to_date },
    })

    const entries = useMemo<Entry[]>(
        () =>
            (data?.results ?? []).map((r) => ({
                name: r.name,
                amount: Number(r.amount),
                days: r.days,
                note: r.note,
            })),
        [data],
    )

    return {
        entries,
        // Jami serverdan keladi — ko'rinadigan qatorlardan qayta hisoblanmaydi.
        total: data ? Number(data.total ?? 0) : 0,
        isLoading,
        isError,
        error,
        hasRange: Boolean(search?.from_date || search?.to_date),
    }
}

function StatusDot({ days }: { days: number }) {
    return (
        <span
            className={cn(
                "size-2 rounded-full shrink-0",
                days > 30 ? "bg-red-500"
                : days > 14 ? "bg-amber-500"
                : "bg-emerald-500",
            )}
            title={`${days} kun`}
        />
    )
}

function EntryList({
    entries,
    total,
    isLoading,
    isError,
    error,
    hasRange,
    variant,
}: {
    entries: Entry[]
    total: number
    isLoading: boolean
    isError: boolean
    error: unknown
    hasRange: boolean
    variant: "income" | "expense"
}) {
    const isIncome = variant === "income"
    return (
        <div className="h-full flex flex-col">
            <div className="px-4 pt-3 pb-[17px] shrink-0 border-b flex items-center gap-3">
                <h3 className="text-xs font-semibold">
                    {isIncome ? "Bizga berishlari kerak" : "Biz berishimiz kerak"}
                </h3>
                {isError ?
                    <span
                        className="text-xs font-semibold text-amber-600 dark:text-amber-500"
                        title={queryErrorHint(error)}
                    >
                        {queryErrorMessage(error)}
                    </span>
                : isLoading ?
                    <span className="text-xs text-muted-foreground">…</span>
                :   <span
                        className={cn(
                            "text-xs font-semibold",
                            isIncome ? "text-emerald-500" : "text-red-500",
                        )}
                    >
                        {isIncome ? "+" : "−"}
                        {formatSom(total)}
                    </span>
                }
            </div>
            <div className="flex-1 overflow-y-auto">
                {isLoading && (
                    <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                        Yuklanmoqda...
                    </p>
                )}

                {!isLoading && isError && (
                    <div className="px-4 py-8 text-center">
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-500">
                            {queryErrorMessage(error)}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                            {queryErrorHint(error)}
                        </p>
                    </div>
                )}

                {!isLoading && !isError && entries.length === 0 && (
                    <div className="px-4 py-8 text-center">
                        <p className="text-xs text-muted-foreground">
                            Ma'lumot yo'q
                        </p>
                        {hasRange && (
                            <p className="mt-1 text-[10px] text-muted-foreground/70">
                                Tanlangan sana oralig'ida qarzdorlik yozuvi
                                topilmadi
                            </p>
                        )}
                    </div>
                )}

                {entries.map((e, i) => (
                    <div
                        key={i}
                        className="px-4 py-2 border-b border-border/40 hover:bg-muted/30 transition-colors flex items-start gap-2"
                    >
                        <StatusDot days={e.days} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium truncate">
                                    {e.name}
                                </span>
                                <span
                                    className={cn(
                                        "text-xs font-semibold shrink-0",
                                        isIncome ?
                                            "text-emerald-500"
                                        :   "text-red-500",
                                    )}
                                >
                                    {isIncome ? "+" : "−"}
                                    {formatSom(e.amount)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                                <span className="text-[10px] text-muted-foreground">
                                    {e.note}
                                </span>
                                <span
                                    className={cn(
                                        "text-[10px] font-medium",
                                        e.days > 30 ? "text-red-500"
                                        : e.days > 14 ? "text-amber-500"
                                        : "text-muted-foreground",
                                    )}
                                >
                                    {e.days} kun
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function DebtorCard() {
    const state = usePartners(FINANCE_DEBTORS)
    return <EntryList {...state} variant="income" />
}

export function CreditorCard() {
    const state = usePartners(FINANCE_CREDITORS)
    return <EntryList {...state} variant="expense" />
}

export default function DebtorCreditor() {
    return (
        <div className="grid grid-cols-2 gap-3 h-full">
            <DebtorCard />
            <CreditorCard />
        </div>
    )
}
