import type { Query } from "@tanstack/react-query"

/**
 * So'rovlar "sog'lig'i" — server javob berayaptimi yoki yo'qmi.
 *
 * Bu fayl sof mantiq (React yo'q): uni ikkita joy ishlatadi —
 *   • `components/custom/server-status-banner.tsx` — butun ilova qatlami
 *   • `hooks/useTableStatus.ts` — jadvalning o'z xato holati
 * ikkalasi bir xil qoidaga tayanishi uchun qoida BITTA joyda yozilgan.
 */

/**
 * Javob kutayotgan so'rov qancha vaqtdan keyin "server javob bermayapti"
 * deb hisoblanadi.
 *
 * axios'ning o'z timeout'i 20 soniya — ya'ni haqiqiy xato o'shanda tug'iladi.
 * Lekin foydalanuvchi 20 soniya davomida ekranda **0** ko'rib turmasligi kerak,
 * shuning uchun ogohlantirish ancha erta, 8 soniyada chiqadi. Oddiy so'rov
 * (eng og'iri ham) bir necha yuz millisekundda qaytadi, shuning uchun 8 soniya
 * sog'lom so'rovga hech qachon tegmaydi.
 */
export const HANG_THRESHOLD_MS = 8000

export const httpStatusOf = (error: unknown): number | undefined => {
    const status = (error as { response?: { status?: number } })?.response
        ?.status
    return typeof status === "number" ? status : undefined
}

/** Server o'chgan / javob bermayapti (tarmoq uzilishi, timeout yoki 5xx). */
export const isServerDownError = (error: unknown) => {
    const status = httpStatusOf(error)
    if (status === undefined) return true // javob umuman kelmadi
    return status >= 500
}

/**
 * Bu xato ILOVA DARAJASIDA ogohlantirishga arziydimi?
 *
 * Yo'q bo'lganlar:
 *   401/403 — "server o'chgan" emas, "ruxsat yo'q"; chiqish yoki sessiya
 *             tugash oqimida bekorga chiqmasin.
 *   404     — aniq bitta manzil topilmadi (masalan diapazondan tashqari
 *             sahifa). Buni jadvalning o'zi joyida tushuntiradi.
 */
export const isReportableError = (error: unknown) => {
    const status = httpStatusOf(error)
    return status !== 401 && status !== 403 && status !== 404
}

/**
 * So'rov HOZIR javob kutib turibdimi?
 *
 * Uchala shart ham zarur:
 *   • `pending`  — hali na natija, na xato bor
 *   • `data === undefined` — ekranda ko'rsatadigan eski natija ham yo'q
 *     (fon yangilanishi ko'rsatiladigan ma'lumotni yo'qotmaydi, u xavfsiz)
 *   • `fetchStatus !== "idle"` — so'rov haqiqatan yo'lda; `idle` bo'lsa bu
 *     O'CHIRILGAN so'rov (`enabled: false`) bo'lishi mumkin va u nosozlik emas
 */
export const isAwaitingResponse = (query: Query) =>
    query.state.status === "pending" &&
    query.state.data === undefined &&
    query.state.fetchStatus !== "idle"

/**
 * Javobsiz osilib qolgan so'rovlarni VAQT bo'yicha kuzatuvchi.
 *
 * react-query keshi "shu so'rov qachondan beri kutmoqda" degan ma'lumotni
 * saqlamaydi, shuning uchun boshlanish vaqti shu yerda yozib boriladi.
 * So'rov javob berishi (yoki yo'q bo'lishi) bilan yozuv o'chadi.
 */
export class HangWatcher {
    private since = new Map<string, number>()

    /** Chegaradan uzoq javobsiz turgan so'rovlar. */
    scan(queries: Query[], now: number = Date.now()): Query[] {
        const alive = new Set<string>()
        const hanging: Query[] = []

        for (const query of queries) {
            if (!isAwaitingResponse(query)) continue
            const key = query.queryHash
            alive.add(key)
            const startedAt = this.since.get(key)
            if (startedAt === undefined) {
                this.since.set(key, now)
                continue
            }
            if (now - startedAt >= HANG_THRESHOLD_MS) hanging.push(query)
        }

        for (const key of [...this.since.keys()]) {
            if (!alive.has(key)) this.since.delete(key)
        }

        return hanging
    }

    /** Kuzatilayotgan so'rov qachondan beri javob kutmoqda. */
    startedAt(query: Query): number | undefined {
        return this.since.get(query.queryHash)
    }

    reset() {
        this.since.clear()
    }
}

/**
 * Javobsiz qolgan so'rov uchun xato obyekti.
 *
 * `response` maydoni yo'q — shuning uchun `describeError` uni "Serverga ulanib
 * bo'lmadi" deb tushuntiradi, ya'ni foydalanuvchi ko'radigan matn haqiqiy
 * tarmoq uzilishi bilan bir xil bo'ladi.
 */
export const hangError = (label = "so'rov") =>
    Object.assign(new Error(`Server javob bermadi (${label})`), {
        name: "HangError",
        isHang: true,
    })
