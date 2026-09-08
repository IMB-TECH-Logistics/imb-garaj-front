import { queryErrorHint, queryErrorMessage } from "@/lib/query-state"
import { AlertTriangle, Inbox } from "lucide-react"

/**
 * REG-XATO-QOLDIQ: Moliya grafiklari uchun xato va bo'sh holat bloklari.
 *
 * MUAMMO: kartalar 2-raundda xato holatiga o'tkazilgan edi, lekin grafik
 * bloklari e'tibordan chetda qolgan. So'rov yiqilganda "Balans dinamikasi"
 * hamon "0 so'm +0 (+0.00%)" deb, "Tushum va Xarajat" afsonasi esa
 * "Tushum: 0, Xarajat: 0, Foyda: 0" deb turardi. Bu bloklar xato holatini
 * bilmagani uchun ulardagi nol HAQIQIY nol kabi o'qiladi — kartalar to'g'ri
 * ishlagani bu yerdagi yolg'onni yanada ishonchli qiladi.
 *
 * QOIDA (ikkalasi ham kerak, chalkashtirmaslik shart):
 *   - so'rov YIQILDI  -> `ChartError`  ("Ma'lumot yuklanmadi", sabab bilan)
 *   - so'rov ISHLADI, natija bo'sh -> `ChartEmpty` ("Ma'lumot topilmadi")
 * Bo'sh natija — bu haqiqat, uni xato deb ko'rsatish ham xato bo'lardi.
 */

export function ChartError({
    error,
    className = "",
}: {
    error: unknown
    className?: string
}) {
    return (
        <div
            role="alert"
            data-testid="chart-error"
            className={`flex h-full w-full flex-col items-center justify-center gap-1.5 px-4 text-center ${className}`}
        >
            <AlertTriangle size={26} className="text-amber-500" />
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-500">
                {queryErrorMessage(error)}
            </p>
            <p className="max-w-[22rem] text-[10px] text-muted-foreground">
                {queryErrorHint(error)}
            </p>
        </div>
    )
}

export function ChartEmpty({
    text = "Ma'lumot topilmadi",
    hint = "Tanlangan sana oralig'ida yozuv yo'q.",
    className = "",
}: {
    text?: string
    hint?: string
    className?: string
}) {
    return (
        <div
            data-testid="chart-empty"
            className={`flex h-full w-full flex-col items-center justify-center gap-1.5 px-4 text-center ${className}`}
        >
            <Inbox size={26} className="text-muted-foreground/50" />
            <p className="text-xs font-medium text-muted-foreground">{text}</p>
            <p className="max-w-[22rem] text-[10px] text-muted-foreground/70">
                {hint}
            </p>
        </div>
    )
}

/** Xato holatida raqam o'rniga chiziladigan qisqa belgi (afsona/sarlavha uchun). */
export const NO_VALUE = "—"

/**
 * Grafik uchun yagona holat tanlagichi.
 *
 * MUHIM: `isError` YETARLI EMAS. Server umuman javob bermasa so'rov
 * `status: "pending"` + `fetchStatus: "idle"` holatida qotib qoladi va
 * `isError` HECH QACHON yonmaydi (2026-09-09 jonli sinovda tasdiqlangan).
 * O'shanda `data` `undefined` bo'ladi va grafik "Ma'lumot topilmadi" deb
 * yozadi — bu YOLG'ON, chunki ma'lumot yo'q emas, so'rov yetib bormadi.
 * Shuning uchun holat `isSuccess` dan boshlab aniqlanadi.
 */
export type ChartQueryState = {
    isSuccess?: boolean
    isError?: boolean
    isLoading?: boolean
    error?: unknown
}

export type ChartPhase = "ok" | "loading" | "error" | "unavailable"

export const chartPhase = (q: ChartQueryState): ChartPhase => {
    if (q.isSuccess) return "ok"
    if (q.isError) return "error"
    if (q.isLoading) return "loading"
    return "unavailable"
}

/** So'rov yetib bormaganda (xato ham, bo'sh ham emas). */
export function ChartUnavailable({ className = "" }: { className?: string }) {
    return (
        <div
            role="alert"
            data-testid="chart-unavailable"
            className={`flex h-full w-full flex-col items-center justify-center gap-1.5 px-4 text-center ${className}`}
        >
            <AlertTriangle size={26} className="text-amber-500" />
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-500">
                Ma'lumot kelmadi
            </p>
            <p className="max-w-[22rem] text-[10px] text-muted-foreground">
                Server javob bermadi. Bu yerda ko'rsatilmayotgan qiymat nolga
                teng degani EMAS.
            </p>
        </div>
    )
}

