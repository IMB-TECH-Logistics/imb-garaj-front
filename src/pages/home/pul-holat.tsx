import { describeError, } from "@/components/custom/data-error"
import { queryErrorMessage } from "@/lib/query-state"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/**
 * PUL MAYDONI UCHUN HOLAT QOIDASI (R3-FE-pul, 1-band).
 *
 * Muammoning o'zagi: pul kartalari `formatMoney(Number(x?.balance ?? 0))`
 * naqshi bilan yozilgan edi. So'rov muvaffaqiyatli TUGAMAGANDA `x`
 * `undefined` bo'ladi va `?? 0` uni jimgina NOLGA aylantiradi. Menejer
 * ekrandagi "0 so'm" ni haqiqiy balans deb o'qiydi — bu eng zararli xato
 * turi, chunki u xato kabi ko'rinmaydi.
 *
 * NEGA `isError` YETARLI EMAS (jonli sinovda aniqlandi, 2026-09-09):
 * so'rov HTTP javobi bilan yiqilsa (404/403/500) react-query `isError` ni
 * yoqadi va hammasi joyida. Lekin server umuman javob bermasa (ulanish
 * uzilgan / server o'chgan) so'rov `status: "pending"` + `fetchStatus: "idle"`
 * holatida qotib qoladi: `isLoading` ham, `isError` ham FALSE, `data` esa
 * `undefined`. Ya'ni faqat `isError` ga tayangan karta AYNAN server
 * o'chganda — eng muhim daqiqada — yana "0 so'm" ko'rsatadi.
 *
 * Shuning uchun qoida teskari tomondan yoziladi: raqam FAQAT `isSuccess`
 * bo'lganda chiziladi. Qolgan barcha holatlar (yuklanmoqda, xato, javobsiz
 * qotib qolgan) raqam EMAS, holat ko'rsatadi.
 */

/** `useGet`/`useQuery` natijasidan kerakli maydonlar. */
export type MoneyQueryState = {
    isSuccess?: boolean
    isError?: boolean
    isLoading?: boolean
    isFetching?: boolean
    error?: unknown
    refetch?: () => unknown
}

export type MoneyPhase = "ok" | "loading" | "error" | "unavailable"

export const moneyPhase = (q: MoneyQueryState): MoneyPhase => {
    if (q.isSuccess) return "ok"
    if (q.isError) return "error"
    if (q.isLoading || q.isFetching) return "loading"
    return "unavailable"
}

/**
 * Server javob bermagan holat uchun sun'iy xato obyekti.
 *
 * `DataTable` bo'sh ro'yxatni "Ma'lumot topilmadi" deb chizadi. So'rov
 * yetib bormaganda bu YOLG'ON — jadvalga "yuklanmadi" deyish uchun unga
 * xato uzatish kerak, lekin react-query bu holatda xato BERMAYDI. Shuning
 * uchun o'zimiz beramiz; `describeError` unda `status` topmagani uchun
 * "Serverga ulanib bo'lmadi..." matnini chiqaradi — aynan kerakli xabar.
 */
export const NO_RESPONSE_ERROR = new Error("Server javob bermadi")

/** `DataTable`ning `error` proponi uchun: xato yoki javobsizlik. */
export const tableError = (q: MoneyQueryState): unknown => {
    if (q.isError) return q.error
    if (!q.isSuccess && !q.isLoading && !q.isFetching) return NO_RESPONSE_ERROR
    return undefined
}

/** Faqat matn kerak bo'lganda (afsona, sarlavha, jadval yig'indisi). */
export const moneyPhaseLabel = (q: MoneyQueryState): string => {
    const phase = moneyPhase(q)
    if (phase === "loading") return "…"
    if (phase === "error") return queryErrorMessage(q.error)
    return "Ma'lumot kelmadi"
}

/**
 * Pul qiymati yoki uning o'rniga holat.
 *
 * `value` — muvaffaqiyatli holatda chiziladigan tayyor tugun (masalan
 * `<>{formatMoney(n)} so'm</>`). U FAQAT `isSuccess` da chaqiriladi.
 */
export function MoneyStat({
    query,
    value,
    className,
    valueClassName,
    compact = false,
}: {
    query: MoneyQueryState
    value: () => ReactNode
    className?: string
    valueClassName?: string
    compact?: boolean
}) {
    const phase = moneyPhase(query)

    if (phase === "ok") {
        return <span className={valueClassName}>{value()}</span>
    }

    if (phase === "loading") {
        return (
            <span className={cn("text-muted-foreground", valueClassName)}>…</span>
        )
    }

    const title = phase === "error" ? queryErrorMessage(query.error) : "Ma'lumot kelmadi"
    const hint =
        phase === "error"
            ? describeError(query.error)
            : "Server javob bermadi. Ko'rsatilmayotgan qiymat nolga teng degani EMAS."

    return (
        <span className={cn("inline-block align-top", className)}>
            <span className="block text-sm font-semibold text-amber-600 dark:text-amber-500">
                {title}
            </span>
            {!compact && (
                <span className="block text-[11px] text-muted-foreground/80">
                    Qiymat ko'rsatilmadi — nol degani emas.
                </span>
            )}
            {query.refetch && (
                <button
                    type="button"
                    title={hint}
                    onClick={() => query.refetch?.()}
                    className="mt-0.5 block text-xs underline underline-offset-2 hover:no-underline"
                >
                    Qayta urinish
                </button>
            )}
        </span>
    )
}
