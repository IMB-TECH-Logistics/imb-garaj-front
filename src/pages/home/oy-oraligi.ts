/**
 * Oy oralig'ini hisoblash — "Oldingi oyni ko'rish" tugmasi uchun.
 *
 * NEGA ALOHIDA FAYL: bu hisob ilgari `buxgalteriya/index.tsx` va
 * `finance/finance-main.tsx` da mustaqil ravishda ikki marta yozilgan edi va
 * IKKALASIDA HAM bir xil xato bor edi:
 *
 *     const d = new Date(to_date)      // 2026-09-30
 *     d.setMonth(d.getMonth() - 1)     // -> 2026-08-30  (31 EMAS!)
 *
 * `setMonth` oyni almashtiradi, lekin OY KUNINI (30) o'zgarishsiz qoldiradi.
 * Sentyabrda 30 kun, avgustda 31 kun bor — natijada oralig'ning oxirgi kuni
 * (31-avgust) tushib qoladi va o'sha kungi ma'lumot foydalanuvchidan
 * YASHIRINADI. O'lchangan zarari: Buxgalteriyada 8 ta reys ko'rinmay qolgan
 * (711 o'rniga 719), `/truck` sahifasida 3 250 000 so'm daromad va 1 reys
 * yo'qolgan (496 202 210.80 o'rniga 499 452 210.80 bo'lishi kerak edi).
 *
 * Tugmaning yorlig'i "Oldingi OYNI ko'rish" — ya'ni foydalanuvchi butun oyni
 * kutadi. Shuning uchun bu yerda kunni siljitmaymiz: oldingi oyning 1-kunidan
 * OXIRGI kunigacha bo'lgan to'liq oraliq qaytariladi.
 */

/** `Date` -> "YYYY-MM-DD" (lokal vaqt bo'yicha; `toISOString` UTC ga siljitadi). */
export const toIsoDate = (d: Date): string => {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Berilgan sana tegishli oyning 1-kuni. */
export const monthStart = (d: Date): Date =>
    new Date(d.getFullYear(), d.getMonth(), 1)

/**
 * Berilgan sana tegishli oyning OXIRGI kuni.
 * `new Date(y, m + 1, 0)` — keyingi oyning "0-kuni", ya'ni joriy oyning oxiri.
 * Fevral/kabisa yili va 30/31 kunli oylarni o'zi to'g'ri hisoblaydi.
 */
export const monthEnd = (d: Date): Date =>
    new Date(d.getFullYear(), d.getMonth() + 1, 0)

const parse = (iso: string | undefined): Date | undefined => {
    if (!iso) return undefined
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? undefined : d
}

/**
 * Joriy oraliqdan `offset` oy narida turgan TO'LIQ oy oralig'i.
 *
 * `offset = -1` — oldingi oy, `-3` — kvartal orqaga, `+1` — keyingi oy.
 * Tayanch nuqta `from_date`, u bo'lmasa `to_date`, u ham bo'lmasa bugun.
 * `new Date(y, m, 1)` oy raqami manfiy yoki 11 dan katta bo'lsa yilni o'zi
 * to'g'rilaydi (dekabr -> yanvar chegarasi).
 */
export const shiftFullMonth = (
    fromIso: string | undefined,
    toIso: string | undefined,
    offset: number,
): { from_date: string; to_date: string } => {
    const anchor = parse(fromIso) ?? parse(toIso) ?? new Date()
    const target = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1)
    return {
        from_date: toIsoDate(monthStart(target)),
        to_date: toIsoDate(monthEnd(target)),
    }
}

/**
 * "YYYY-MM-DD" -> LOKAL yarim tundagi `Date`.
 *
 * `new Date("2026-08-01")` ni JS UTC deb o'qiydi va manfiy vaqt mintaqasida
 * sana bir kun orqaga suriladi. Bu yerda qismlarga ajratib lokal sana
 * yasaymiz — sana filtri hech qachon kunni siljitmasin.
 */
export const parseLocalDate = (iso: string): Date => {
    const [y, m, d] = iso.split("-").map(Number)
    if (!y || !m || !d) return new Date(iso)
    return new Date(y, m - 1, d)
}

/**
 * FE3-34: sana filtridan haqiqiy oraliqni chiqarish.
 *
 * MUAMMO: `ParamDateRange` bitta kun tanlanganda URL ga faqat `from_date`
 * yozadi (`to_date` `undefined` bo'lgani uchun manzildan butunlay tushib
 * qoladi). Monitoring sahifalari esa `to_date` yo'qligini "oy oxirigacha"
 * deb talqin qilardi:
 *
 *     const to = search.to_date ? new Date(search.to_date) : endOfMonth(today)
 *
 * Natijada 01/08/2026 tanlanganda ekranda 08-01 … 08-31 oralig'i chiqardi —
 * masofa 14 794.63 km, aslida o'sha kuni ~6 908 km. Ya'ni 7.2 barobar oshiq.
 *
 * TO'G'RI QOIDA: ikkala chekka ham yo'q bo'lsa — joriy oy; faqat bittasi
 * bo'lsa — O'SHA BITTA KUN (from = to).
 */
export const resolveDayRange = (
    fromIso: string | undefined,
    toIso: string | undefined,
): { from: Date; to: Date } => {
    const today = new Date()
    if (!fromIso && !toIso) {
        return { from: monthStart(today), to: monthEnd(today) }
    }
    const from = fromIso ? parseLocalDate(fromIso) : undefined
    const to = toIso ? parseLocalDate(toIso) : undefined
    return { from: (from ?? to) as Date, to: (to ?? from) as Date }
}

/** Joriy (bugungi) oyning to'liq oralig'i. */
export const currentMonthRange = (): { from_date: string; to_date: string } => {
    const today = new Date()
    return {
        from_date: toIsoDate(monthStart(today)),
        to_date: toIsoDate(monthEnd(today)),
    }
}
