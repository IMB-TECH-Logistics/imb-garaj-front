/**
 * YANGI-04 / F5-32: so'rov yiqilganda pul ko'rsatadigan blok NOL ko'rsatmasin.
 *
 * "0 so'm" bilan "ma'lumot berilmadi" bir xil narsa emas — menejer ekrandagi
 * nolni haqiqiy balans deb o'qishi mumkin. Shuning uchun xato holatida raqam
 * o'rniga sababi yozilgan blok chiziladi.
 */

export const errorStatus = (error: unknown): number | undefined =>
    (error as { response?: { status?: number } } | undefined)?.response?.status

/** Foydalanuvchiga ko'rsatiladigan qisqa sabab (o'zbekcha). */
export function queryErrorMessage(error: unknown): string {
    const status = errorStatus(error)
    if (status === 403) return "Ruxsat yo'q"
    if (status === 401) return "Sessiya tugagan"
    if (status === 404) return "Server bu ma'lumotni bermayapti (404)"
    if (typeof status === "number" && status >= 500) return "Server xatosi"
    if (typeof status === "number") return `Xato (${status})`
    return "Bog'lanib bo'lmadi"
}

/** Uzunroq tushuntirish — hint/tooltip uchun. */
export function queryErrorHint(error: unknown): string {
    const status = errorStatus(error)
    if (status === 403)
        return "Bu ma'lumotni ko'rish uchun ruxsatingiz yo'q. Ko'rsatilmayotgan qiymat nolga teng degani EMAS."
    if (status === 401) return "Sessiya tugagan — qaytadan kiring."
    return "Ma'lumot yuklanmadi. Ko'rsatilmayotgan qiymat nolga teng degani emas — keyinroq qayta urinib ko'ring."
}
