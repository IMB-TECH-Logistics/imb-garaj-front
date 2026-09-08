/**
 * MT-14 yordamchilari.
 *
 * DRF diapazondan tashqari sahifa raqamiga 404 ("Invalid page") qaytaradi.
 * Ikki nozik joy bor:
 *
 * 1. 404 ni qayta so'rash mantiqsiz — javob hech qachon o'zgarmaydi. Standart
 *    react-query 3 marta qayta uradi, ya'ni xato holati ~7 soniya kechikadi.
 * 2. `isError` ga tayanib bo'lmaydi: react-query qayta urinishlarni "paused"
 *    holatiga qo'yishi mumkin (onlineManager offline deb hisoblaganda) — u holda
 *    so'rov muvaffaqiyatsiz bo'lsa ham `status` abadiy "pending" bo'lib qoladi va
 *    `isError` HECH QACHON true bo'lmaydi. Lokalda aynan shu kuzatildi.
 *
 * Shuning uchun: 404 da qayta urinmaymiz va xatoni birinchi muvaffaqiyatsizlikdan
 * (failureCount) aniqlaymiz.
 */

const getStatus = (error: unknown) =>
    (error as { response?: { status?: number } } | undefined)?.response?.status

export const retryExceptNotFound = (failureCount: number, error: unknown) => {
    // 2-raund: ilgari faqat 404 istisno edi, 403 esa 3 marta qayta so'ralardi
    // (~7 soniya orqaga chekinish bilan). Shu vaqt davomida sahifa na jadval,
    // na xato ko'rsatardi — ruxsati yo'q foydalanuvchi sababsiz bo'sh "Ro'yxat 0"
    // kartasini ko'rib turardi. Hech qaysi 4xx qayta so'raganda o'zgarmaydi,
    // shuning uchun hammasi darhol xatoga aylantiriladi (`useGet` dagi standart
    // `retryPolicy` bilan bir xil qoida).
    const status = getStatus(error)
    if (typeof status === "number" && status >= 400 && status < 500) {
        return false
    }
    return failureCount < 3
}

type QueryLike = {
    data?: unknown
    isError: boolean
    failureCount: number
}

/** So'rov kamida bir marta yiqilgan va hech qanday ma'lumot yo'q. */
export const isPageRequestFailed = (query: QueryLike) =>
    !query.data && (query.isError || query.failureCount > 0)
