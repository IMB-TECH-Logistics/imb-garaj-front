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
    if (getStatus(error) === 404) return false
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
