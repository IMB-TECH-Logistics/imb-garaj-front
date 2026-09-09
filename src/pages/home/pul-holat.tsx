import { describeError } from "@/components/custom/data-error"
import { queryErrorMessage } from "@/lib/query-state"
import { cn } from "@/lib/utils"
import * as React from "react"
import type { ReactNode } from "react"

/**
 * PUL MAYDONI UCHUN HOLAT QOIDASI (R3-FE-pul, 1-band; R5-da kuchaytirildi).
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
 *
 * ══ 5-RAUND QO'SHIMCHASI: "muvaffaqiyatli, lekin ESKIRGAN" ═══════════════
 *
 * Yakuniy sinovda (P-47) `/kassa` server 503 qaytarayotganda 20+ soniya
 * davomida MUTLAQO sog'lom ko'rindi: "Asosiy Balans −867 130 508 so'm"
 * o'z joyida turdi, na ogohlantirish, na "Qayta urinish" chiqdi. Boshqa
 * to'rtta pul sahifasi esa 2–10 soniyada ogohlantirdi.
 *
 * Sabab yuqoridagi qoidaning teshigi emas — uning QAMROVI edi:
 *
 *   `useGet` da `staleTime` 5 daqiqa. Karta bir marta muvaffaqiyatli
 *   yuklangach, react-query BOSHQA HECH QACHON serverga murojaat qilmaydi.
 *   Server o'lsa ham so'rov yiqilmaydi — chunki so'rov umuman YUBORILMAYDI.
 *   `isSuccess` `true` bo'lib qolaveradi, eskirgan raqam esa joriy qiymat
 *   sifatida chizilaveradi. Boshqa sahifalar ogohlantirgani — o'sha paytda
 *   ular yangi so'rov yuborgani uchun, ya'ni tasodif.
 *
 * Ya'ni "bu raqam hozir ham to'g'rimi?" degan savolga javob berish uchun
 * kartaning O'ZI vaqti-vaqti bilan serverdan so'rashi kerak. Shuning uchun
 * bu yerda ikkita narsa bor:
 *
 *   1. YURAK URISHI (`useMoneyPhase`) — ko'rsatilayotgan raqam
 *      `MONEY_REVALIDATE_MS` dan eskirsa karta o'zi `refetch()` qiladi.
 *      Bu — "server tirikmi" savolini beradigan yagona mexanizm.
 *   2. ESKIRGAN HUKMI — so'rov muvaffaqiyatli bo'lsa ham, agar keyingi
 *      yangilash yiqilayotgan bo'lsa (`failureCount`, `isRefetchError`)
 *      yoki raqam `MONEY_STALE_MS` dan eski bo'lsa (javobsiz osilish),
 *      u JORIY qiymat sifatida ko'rsatilmaydi.
 *
 * ⚠ Teskari xavf ham hisobga olingan: server sog'lom bo'lganda ogohlantirish
 * CHIQMASLIGI shart, aks holda signal ishonchini yo'qotadi. Shuning uchun
 *   • yurak urishi sog'lom serverda har ~5 soniyada muvaffaqiyat bilan
 *     tugaydi va yosh hech qachon `MONEY_STALE_MS` ga yetmaydi;
 *   • bitta tasodifiy uzilish (1 marta yiqilib, keyin darhol tuzalgan)
 *     ogohlantirmaydi — hukm uchun kamida IKKI ketma-ket muvaffaqiyatsizlik
 *     kerak (`MIN_FAILURES`).
 */

/** Soatning qadam tashlashi — yoshni qayta hisoblash uchun. */
const MONEY_TICK_MS = 2_000

/**
 * Raqam shu muddatdan eskirsa, karta serverdan qayta so'raydi.
 *
 * `staleTime` (5 daqiqa) ni ataylab chetlab o'tadi: pul kartasi uchun
 * "5 daqiqa oldingi balans" — joriy balans emas, va eng muhimi, so'rovsiz
 * server o'chganini bilib bo'lmaydi.
 */
const MONEY_REVALIDATE_MS = 5_000

/**
 * Shu muddatdan eski raqam JORIY deb ko'rsatilmaydi.
 *
 * Bu — server ulanishni qabul qilib, javobni HECH QACHON qaytarmagan holat
 * uchun (o'shanda na xato bo'ladi, na `failureCount` oshadi — axios timeout'i
 * esa 20 soniya). Sog'lom serverda yosh eng ko'pi ~8 soniya bo'ladi
 * (5 s yangilash + javob vaqti + 2 s qadam), shuning uchun 14 soniya
 * noto'g'ri ogohlantirish bermaydi.
 */
const MONEY_STALE_MS = 14_000

/** Ogohlantirish uchun kerakli ketma-ket muvaffaqiyatsizlik soni. */
const MIN_FAILURES = 2

/**
 * Birinchi yiqilishdan keyin tasdiqlovchi so'rov qancha kutib yuboriladi.
 *
 * Qisqa: server haqiqatan o'chgan bo'lsa foydalanuvchi ~11 soniyada biladi;
 * lekin nolga teng emas — bir zumlik uzilishga tuzalish imkoni beriladi.
 */
const CONFIRM_PROBE_MS = 500

/**
 * Tekshiruv so'rovi qancha kutiladi.
 *
 * NEGA KERAK (jonli sinovda o'lchandi): server o'chganda `refetch()`
 * qaytaradigan promise DARHOL hal bo'lmaydi — react-query qayta urinishlari
 * bilan birga u ~15 soniya osilib turdi. Ya'ni "javob keldimi" savolini
 * faqat promise'ga tayanib berish mumkin emas: aynan eng muhim holatda
 * javob kelmaydi va kod jim qoladi.
 *
 * Shuning uchun tekshiruv poyga (`Promise.race`) bilan yuritiladi: 3 soniya
 * ichida hal bo'lmagan so'rov MUVAFFAQIYATSIZ deb hisoblanadi. Bu ham
 * mazmunan to'g'ri — 3 soniyada javob bermagan server ekrandagi raqamni
 * tasdiqlay olmagan bo'ladi. Sog'lom serverda bu so'rovlar bir necha yuz
 * millisekundda qaytadi, ya'ni chegara ularga tegmaydi.
 */
const PROBE_TIMEOUT_MS = 3_000

/** `useGet`/`useQuery` natijasidan kerakli maydonlar. */
export type MoneyQueryState = {
    isSuccess?: boolean
    isError?: boolean
    isLoading?: boolean
    isFetching?: boolean
    error?: unknown
    refetch?: () => unknown
    /** Ko'rsatilayotgan ma'lumot QACHON kelgan (react-query beradi). */
    dataUpdatedAt?: number
    /** Joriy (hali tugamagan) urinishlar zanjiridagi muvaffaqiyatsizliklar. */
    failureCount?: number
    /** Ma'lumot bor edi, lekin uni YANGILASH yiqildi. */
    isRefetchError?: boolean
    /** Shu so'rov umuman qancha marta xato bergan. */
    errorUpdateCount?: number
}

export type MoneyPhase = "ok" | "loading" | "error" | "unavailable" | "stale"

/**
 * Muvaffaqiyatli so'rovning ustidan yangilash urinishi yiqilganmi?
 *
 * `isRefetchError` — react-query'ning o'z belgisi (ma'lumot bor, oxirgi
 * yangilash xato bilan tugadi). `failureCount` esa yangilash HALI qayta
 * urinishlar ichida ekanini ko'rsatadi: uni kutib o'tirmaymiz, chunki
 * foydalanuvchi shu paytda ham eskirgan raqamga qarab turadi.
 */
const refetchFailing = (q: MoneyQueryState) =>
    !!q.isRefetchError || (q.failureCount ?? 0) >= MIN_FAILURES

/**
 * Holat hukmi.
 *
 * `now` berilmasa yosh bo'yicha tekshiruv o'tkazib yuboriladi (sof funksiya
 * sifatida, React'siz chaqirilishi uchun). Komponentlar `useMoneyPhase` ni
 * ishlatsin — u yoshni ham hisobga oladi va yurak urishini yuritadi.
 */
export const moneyPhase = (q: MoneyQueryState, now?: number): MoneyPhase => {
    if (q.isError) return "error"
    if (q.isSuccess) {
        if (refetchFailing(q)) return "stale"
        if (
            now !== undefined &&
            !!q.dataUpdatedAt &&
            now - q.dataUpdatedAt > MONEY_STALE_MS
        ) {
            return "stale"
        }
        return "ok"
    }
    if (q.isLoading || q.isFetching) return "loading"
    return "unavailable"
}

/** Raqam ishonch bilan ko'rsatilishi mumkinmi. */
export const isTrustedPhase = (phase: MoneyPhase) => phase === "ok"

/**
 * Pul so'rovining holati + YURAK URISHI.
 *
 * Ko'rsatilayotgan raqam eskirgan bo'lsa serverdan qayta so'raydi. Aynan
 * shu so'rov "server tirikmi" savoliga javob beradi: usiz `staleTime`
 * tufayli karta soatlab hech narsa so'ramasligi va server o'chganini
 * sezmasligi mumkin (P-47).
 */
export const useMoneyPhase = (q: MoneyQueryState): MoneyPhase => {
    const [now, setNow] = React.useState(() => Date.now())

    // Interval qayta-qayta qurilmasligi uchun o'zgaruvchan qism ref'da.
    const latest = React.useRef(q)
    latest.current = q

    /**
     * NEGA YIQILISHNI O'ZIMIZ SANAYMIZ (jonli 503 sinovida aniqlandi).
     *
     * `q.failureCount` va `q.isRefetchError` ga tayanish yetarli emas edi:
     * fon yangilashi 503 bilan qaytganda react-query so'rovni `success`
     * holatida qoldirdi — `failureCount` ham, `isRefetchError` ham
     * yonmadi. Natijada eskirish faqat `MONEY_STALE_MS` (18 s) bo'yicha
     * aniqlanardi, ya'ni juda kech.
     *
     * `refetch()` esa halol javob beradi: u XATO TASHLAMAYDI, natija
     * obyektini qaytaradi va unda `isError` bor. Ya'ni "server javob
     * berdimi" savoliga eng ishonchli javob — o'zimiz yuborgan
     * tekshiruv so'rovining natijasi. Shuni sanaymiz.
     */
    const failures = React.useRef(0)
    const probing = React.useRef(false)
    const [, bump] = React.useState(0)

    const isSuccess = !!q.isSuccess

    React.useEffect(() => {
        // Yurak urishi FAQAT ekranda raqam turganda kerak. Yuklanayotgan yoki
        // yiqilgan so'rovni react-query o'zi boshqaradi.
        if (!isSuccess) return

        let alive = true
        let confirmTimer: ReturnType<typeof setTimeout> | undefined

        const probe = async () => {
            const cur = latest.current
            if (!cur.refetch || probing.current) return
            probing.current = true
            try {
                const timedOut = Symbol("timeout")
                const res = (await Promise.race([
                    cur.refetch(),
                    new Promise((resolve) =>
                        setTimeout(() => resolve(timedOut), PROBE_TIMEOUT_MS),
                    ),
                ])) as
                    | { isError?: boolean; status?: string }
                    | symbol
                    | undefined
                const failed =
                    res === timedOut ||
                    (typeof res === "object" &&
                        res !== null &&
                        ((res as { isError?: boolean }).isError === true ||
                            (res as { status?: string }).status === "error"))
                failures.current = failed ? failures.current + 1 : 0
            } catch {
                // `refetch()` odatda tashlamaydi, lekin tashlasa — yiqilish.
                failures.current += 1
            } finally {
                probing.current = false
            }
            if (!alive) return
            bump((n) => n + 1)

            /**
             * Bitta yiqilish hali ogohlantirish uchun asos emas — u qisqa
             * tarmoq uzilishi ham bo'lishi mumkin. Shuning uchun darhol
             * TASDIQLOVCHI ikkinchi so'rov yuboriladi: server haqiqatan
             * o'chgan bo'lsa hukm ~1.5 soniyada chiqadi, tasodifiy uzilish
             * esa jimgina tuzaladi va foydalanuvchi bekorga qo'rqmaydi.
             */
            if (failures.current > 0 && failures.current < MIN_FAILURES) {
                confirmTimer = setTimeout(probe, CONFIRM_PROBE_MS)
            }
        }

        const tick = () => {
            const cur = latest.current
            setNow(Date.now())
            if (cur.isFetching || probing.current) return
            const age = Date.now() - (cur.dataUpdatedAt ?? 0)
            if (age >= MONEY_REVALIDATE_MS) void probe()
            // Diqqat: `probe()` ning o'zi `isFetching` ni tekshirmaydi —
            // tasdiqlovchi so'rov osilib qolgan so'rov ustidan ham
            // yuborilishi kerak, aks holda hukm hech qachon chiqmaydi.
        }

        const timer = setInterval(tick, MONEY_TICK_MS)
        return () => {
            alive = false
            clearInterval(timer)
            if (confirmTimer) clearTimeout(confirmTimer)
        }
    }, [isSuccess])

    const phase = moneyPhase(q, now)
    // Tekshiruv so'rovi ketma-ket yiqilgan bo'lsa raqam joriy EMAS.
    if (phase === "ok" && failures.current >= MIN_FAILURES) return "stale"
    return phase
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
    if (phase === "stale") return "Ma'lumot eskirgan"
    return "Ma'lumot kelmadi"
}

const clockOf = (ts?: number) => {
    if (!ts) return null
    const d = new Date(ts)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })
}

/**
 * Pul qiymati yoki uning o'rniga holat.
 *
 * `value` — muvaffaqiyatli holatda chiziladigan tayyor tugun (masalan
 * `<>{formatMoney(n)} so'm</>`). U FAQAT "ok" holatida chaqiriladi.
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
    const phase = useMoneyPhase(query)

    if (phase === "ok") {
        return <span className={valueClassName}>{value()}</span>
    }

    if (phase === "loading") {
        return (
            <span className={cn("text-muted-foreground", valueClassName)}>…</span>
        )
    }

    const retry = query.refetch && (
        <button
            type="button"
            title={
                phase === "error"
                    ? describeError(query.error)
                    : "Serverdan yangi qiymat so'rash"
            }
            onClick={() => query.refetch?.()}
            className="mt-0.5 block text-xs underline underline-offset-2 hover:no-underline"
        >
            Qayta urinish
        </button>
    )

    /**
     * ESKIRGAN: raqam bor, lekin u JORIY emas.
     *
     * Uni butunlay yashirmaymiz — oxirgi ma'lum balans foydali ma'lumot.
     * Lekin u joriy qiymat qiyofasida ko'rinmasligi kerak, shuning uchun
     * o'chirilgan rangda, "eskirgan" yozuvi va kelgan vaqti bilan beriladi.
     */
    if (phase === "stale") {
        const at = clockOf(query.dataUpdatedAt)
        return (
            <span className={cn("inline-block align-top", className)}>
                <span
                    role="status"
                    className="block text-sm font-semibold text-amber-600 dark:text-amber-500"
                >
                    Ma'lumot eskirgan
                </span>
                <span
                    className={cn(
                        "block text-muted-foreground/70 line-through decoration-amber-600/50",
                        valueClassName,
                    )}
                >
                    {value()}
                </span>
                {!compact && (
                    <span className="block text-[11px] text-muted-foreground/80">
                        Server javob bermayapti. Bu — {at ? `${at} dagi` : "eski"}{" "}
                        qiymat, hozirgi holat EMAS.
                    </span>
                )}
                {retry}
            </span>
        )
    }

    const title =
        phase === "error" ? queryErrorMessage(query.error) : "Ma'lumot kelmadi"

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
            {retry}
        </span>
    )
}
