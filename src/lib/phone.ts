/**
 * O'zbekiston telefon raqami bilan ishlash — yagona joy.
 *
 * Nega kerak (raund-2, YANGI-01/Critical):
 * `FormFormatNumberInput` `format="+998 ## ### ## ##"` bilan ishlaganda
 * `+998` FORMAT MATNINING bir qismi, ya'ni forma qiymati sifatida faqat
 * 9 ta raqam saqlanadi (`901112233`). Backend esa
 * `+998XXXXXXXXX` ko'rinishini talab qiladi — natijada haydovchi
 * qo'shish har safar 400 bilan yiqilardi, foydalanuvchi esa ekranda
 * `+998 90 111 22 33` ni ko'rib turardi.
 *
 * Shuning uchun yuborishdan OLDIN raqam shu yerda normallashtiriladi.
 */

/** Faqat raqamlar. */
export const phoneDigits = (value: unknown): string =>
    String(value ?? "").replace(/\D/g, "")

/** Mamlakat kodisiz milliy qism (9 ta raqam): `+998901112233` → `901112233`. */
export const uzLocalDigits = (value: unknown): string => {
    const digits = phoneDigits(value)
    if (digits.length === 12 && digits.startsWith("998")) return digits.slice(3)
    if (digits.length === 13 && digits.startsWith("0998")) return digits.slice(4)
    return digits
}

/** To'liq 9 ta milliy raqam kiritilganmi? */
export const isValidUzPhone = (value: unknown): boolean =>
    uzLocalDigits(value).length === 9

/**
 * Backendga yuboriladigan ko'rinish: `+998XXXXXXXXX`.
 * Raqam to'liq bo'lmasa `null` qaytaradi (yuborilmasin).
 */
export const toUzPhone = (value: unknown): string | null => {
    const local = uzLocalDigits(value)
    return local.length === 9 ? `+998${local}` : null
}

/**
 * Formaga yuklash uchun teskari amal: serverdan kelgan `+998901112233` ni
 * `PatternFormat` kutayotgan 9 ta raqamga qaytaradi.
 */
export const fromUzPhone = (value: unknown): string => uzLocalDigits(value)
