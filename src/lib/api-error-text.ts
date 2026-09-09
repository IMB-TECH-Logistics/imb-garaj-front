import { fieldLabel } from "./field-labels"

/**
 * Backend xato javobini FOYDALANUVCHI O'QIY OLADIGAN o'zbekcha matnga
 * aylantiradigan yagona joy.
 *
 * Nega kerak (raund-2, YANGI-01/High):
 * backend endi to'liq, tushunarli o'zbekcha `detail` qaytaradi va yoniga
 * diagnostika maydonlarini qo'shadi:
 *
 *   { detail: "Bu yuk turi ishlatilmoqda, shuning uchun o'chirib bo'lmaydi:
 *              1 ta buyurtma, 1 ta yo'nalish.",
 *     used_by: { orders: 1, directions: 1 } }
 *
 * Eski ko'rsatgichlar `detail` ni O'QIMAY javobning barcha kalitlarini
 * ketma-ket yozardi va obyektni `String()` qilardi — ekranda
 * **"used_by: [object Object]"** chiqardi. Ya'ni backend to'g'ri javob
 * bergani holda foydalanuvchi sababni bilmasdi.
 *
 * Bu modul quyidagi shakllarning HAMMASINI to'g'ri o'qiydi:
 *   "matn"                                  → o'sha matn
 *   ["matn", "matn2"]                       → qatorma-qator
 *   { detail: "matn", ...diagnostika }      → faqat `detail`
 *   { username: ["..."] }                   → "Login: ..."
 *   { driver: { phone: ["..."] } }          → "Telefon raqami: ..." (ichma-ich)
 *   { non_field_errors: ["..."] }           → yorliqsiz
 *
 * va HECH QACHON `[object Object]` chiqarmaydi: matn topilmagan qiymat
 * (masalan `used_by: {orders: 1}`) butunlay tashlab yuboriladi.
 */

export type ApiFieldError = { path: string; message: string }

export type ApiErrorInfo = {
    /** HTTP status (javob bo'lmasa `undefined`). */
    status?: number
    /** Server umuman javob bermadi (tarmoq uzilishi / server o'chgan). */
    isNetwork: boolean
    /** Ekranga chiqarish uchun tayyor o'zbekcha matn. */
    text: string
    /** Formada maydon ostida ko'rsatish uchun (`path` — react-hook-form nomi). */
    fields: ApiFieldError[]
}

/**
 * Faqat DIAGNOSTIKA uchun keladigan kalitlar — bular foydalanuvchiga
 * ko'rsatilmaydi, chunki mazmuni `detail` da allaqachon aytilgan.
 */
const DIAGNOSTIC_KEYS = new Set([
    "code",
    "used_by",
    "blocked_by",
    "blocked_count",
    "status_code",
    "trace",
    "traceback",
    "meta",
    "debug",
    "exception",
    "view",
    "hint",
])

const MAX_DEPTH = 5

/** Qiymat ichidagi barcha MATNLI barglar (raqam-only qiymatlar tashlanadi). */
const leafTexts = (value: unknown, depth = 0): string[] => {
    if (value === null || value === undefined) return []
    if (typeof value === "string") {
        const t = value.trim()
        return t ? [t] : []
    }
    if (typeof value === "number" || typeof value === "boolean") return []
    if (depth >= MAX_DEPTH) return []
    if (Array.isArray(value)) {
        return value.flatMap((v) => leafTexts(v, depth + 1))
    }
    if (typeof value === "object") {
        return Object.entries(value as Record<string, unknown>)
            .filter(([k]) => !DIAGNOSTIC_KEYS.has(k))
            .flatMap(([, v]) => leafTexts(v, depth + 1))
    }
    return []
}

/** Matn allaqachon o'zbekchami? (backend endi ko'p joyda o'zbekcha yozadi) */
const looksUzbek = (text: string) =>
    /(bo['’]l|o['’]ch|kerak|kiriting|mavjud|emas|qiling|topilmadi|xatolik|ruxsat|tanlang|yetarli|band|noto['’]g|iltimos|yuborilmadi|ishlatilmoqda|bog['’]langan|qayta urin)/i.test(
        text,
    )

/**
 * Xabar ichidagi son (`-100`, `0`, `12.5`) — DRF chegara xabarlarida
 * chegara qiymati matnning bir qismi bo'lib keladi.
 */
const NUM = String.raw`(-?\d+(?:[.,]\d+)?)`

/**
 * Inglizcha DRF/Django xabarlari → o'zbekcha.
 *
 * `uz` ikkinchi argument sifatida `test` ning MOSLIK NATIJASINI oladi —
 * shu sabab xabar ichidagi sonni (chegarani) o'zbekcha matnga ko'chirish
 * mumkin. Sonni ishlatmaydigan qoidalar uni oddiygina e'tiborsiz qoldiradi.
 */
const MESSAGE_RULES: {
    test: RegExp
    uz: (label: string, match: RegExpMatchArray) => string
}[] = [
    {
        test: /already exists|must be unique|must make a unique set/i,
        uz: (l) => (l ? `${l} allaqachon band — boshqasini kiriting` : "Bunday yozuv allaqachon mavjud"),
    },
    {
        test: /may not be blank|may not be null|this field is required|is required/i,
        uz: (l) => (l ? `${l}ni to'ldiring` : "Bu maydonni to'ldirish shart"),
    },
    {
        test: /no more than (\d+) characters/i,
        uz: (l) => (l ? `${l} juda uzun` : "Kiritilgan matn juda uzun"),
    },
    {
        test: /at least (\d+) characters/i,
        uz: (l) => (l ? `${l} juda qisqa` : "Kiritilgan matn juda qisqa"),
    },
    {
        test: /a valid (number|integer|decimal) is required|enter a (number|valid)/i,
        uz: (l) => (l ? `${l} son bo'lishi kerak` : "To'g'ri son kiriting"),
    },
    {
        test: /greater than zero|must be positive|should be positive/i,
        uz: (l) => (l ? `${l} noldan katta bo'lishi kerak` : "Qiymat noldan katta bo'lishi kerak"),
    },
    /*
     * B-50: DRF ning sonli chegara xabarlari (`Ensure this value is greater
     * than or equal to 0.`) foydalanuvchiga INGLIZCHA yetib borardi —
     * masalan manfiy probeg kiritilganda. Chegara qiymati (0, 100, 12.5)
     * har safar boshqacha bo'lgani uchun oddiy lug'at yetmaydi: son
     * REGEX bilan ajratib olinib, o'zbekcha jumlaga qo'yiladi.
     * Sonli qoidalar UMUMIY qoidalardan oldin turishi shart — aks holda
     * quyidagi sonsiz variantlar birinchi bo'lib mos kelib qolardi.
     */
    {
        test: new RegExp(`greater than or equal to\\s*${NUM}`, "i"),
        uz: (l, m) =>
            l ?
                `${l} ${m[1]} dan kichik bo'lmasligi kerak.`
            :   `Qiymat ${m[1]} dan kichik bo'lmasligi kerak.`,
    },
    {
        test: new RegExp(`less than or equal to\\s*${NUM}`, "i"),
        uz: (l, m) =>
            l ?
                `${l} ${m[1]} dan katta bo'lmasligi kerak.`
            :   `Qiymat ${m[1]} dan katta bo'lmasligi kerak.`,
    },
    {
        test: new RegExp(`greater than\\s+${NUM}`, "i"),
        uz: (l, m) =>
            l ?
                `${l} ${m[1]} dan katta bo'lishi kerak.`
            :   `Qiymat ${m[1]} dan katta bo'lishi kerak.`,
    },
    {
        test: new RegExp(`less than\\s+${NUM}`, "i"),
        uz: (l, m) =>
            l ?
                `${l} ${m[1]} dan kichik bo'lishi kerak.`
            :   `Qiymat ${m[1]} dan kichik bo'lishi kerak.`,
    },
    // Sonsiz (masalan sana chegarasi) variantlar — eski xatti-harakat.
    {
        test: /greater than or equal to/i,
        uz: (l) => (l ? `${l} juda kichik` : "Qiymat juda kichik"),
    },
    {
        test: /less than or equal to/i,
        uz: (l) => (l ? `${l} ruxsat etilgan chegaradan oshdi` : "Qiymat chegaradan oshdi"),
    },
    {
        test: /no more than \d+ decimal place/i,
        uz: () => "Kasr qismi 2 xonadan oshmasligi kerak",
    },
    {
        test: /insufficient|not enough|exceeds? (the )?(available|balance|stock|quantity)/i,
        uz: () => "Mavjud qoldiq yetarli emas",
    },
    {
        test: /valid date|date has wrong format/i,
        uz: () => "Sana formati noto'g'ri",
    },
    {
        test: /object with .* does not exist|invalid pk|does not exist/i,
        uz: (l) => (l ? `Tanlangan ${l.toLowerCase()} topilmadi` : "Tanlangan ma'lumot topilmadi"),
    },
    {
        test: /not found/i,
        uz: () => "Ma'lumot topilmadi",
    },
    {
        test: /permission|not allowed|forbidden/i,
        uz: () => "Bu amal uchun ruxsatingiz yo'q",
    },
    {
        test: /credentials|authentication/i,
        uz: () => "Login yoki parol noto'g'ri",
    },
    {
        test: /invalid|not a valid/i,
        uz: (l) => (l ? `${l} noto'g'ri kiritilgan` : "Kiritilgan qiymat noto'g'ri"),
    },
]

/** Bitta xabarni o'zbekchalashtirish (o'zbekcha bo'lsa — tegilmaydi). */
export const translateMessage = (raw: string, label?: string): string => {
    const text = raw.trim()
    if (!text) return ""
    if (looksUzbek(text)) return text
    // Qoidalar TARTIB bilan sinaladi va birinchi mos kelgani ishlatiladi —
    // `match` qaytarilgani uchun qoida xabar ichidagi sonni ham o'qiy oladi.
    for (const rule of MESSAGE_RULES) {
        const match = text.match(rule.test)
        if (match) return rule.uz(label ?? "", match)
    }
    // Mos qoida topilmadi — matn avvalgidek o'zgarishsiz qaytadi.
    return label ? `${label}: ${text}` : text
}

/** `{ driver: { phone: [...] } }` → `[{ path: "driver.phone", ... }]` */
const collectFields = (
    value: unknown,
    prefix: string,
    out: ApiFieldError[],
    depth = 0,
) => {
    if (depth >= MAX_DEPTH || value === null || value === undefined) return

    if (
        typeof value === "string" ||
        (Array.isArray(value) && value.every((v) => typeof v !== "object" || v === null))
    ) {
        const texts = leafTexts(value)
        if (!texts.length) return
        const label = fieldLabel(prefix)
        out.push({
            path: prefix,
            message: texts
                .map((t) => translateMessage(t, label))
                .filter(Boolean)
                .join(" "),
        })
        return
    }

    if (Array.isArray(value)) {
        value.forEach((v, i) => collectFields(v, `${prefix}.${i}`, out, depth + 1))
        return
    }

    if (typeof value === "object") {
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            if (DIAGNOSTIC_KEYS.has(k)) continue
            collectFields(v, prefix ? `${prefix}.${k}` : k, out, depth + 1)
        }
    }
}

const readStatus = (err: any): number | undefined => {
    const s = Number(err?.response?.status ?? err?.status)
    return Number.isFinite(s) && s > 0 ? s : undefined
}

/** Xato javobini tahlil qiladi. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseApiError = (err: any): ApiErrorInfo => {
    const status = readStatus(err)
    const hasResponse = !!err?.response
    const isNetwork = !hasResponse

    if (isNetwork) {
        const timedOut = err?.code === "ECONNABORTED"
        return {
            status,
            isNetwork: true,
            text:
                timedOut ?
                    "Server javob bermadi (vaqt tugadi). Qayta urinib ko'ring."
                :   "Server bilan bog'lanib bo'lmadi. Internet aloqasi yoki server holatini tekshiring.",
            fields: [],
        }
    }

    if (status && status >= 500) {
        return {
            status,
            isNetwork: false,
            text: `Serverda xatolik yuz berdi (${status}). Keyinroq qayta urinib ko'ring.`,
            fields: [],
        }
    }

    const data = err?.response?.data

    if (typeof data === "string" && data.trim()) {
        // HTML sahifa qaytgan bo'lsa uni ekranga chiqarish mantiqsiz.
        const isHtml = /^\s*<(!doctype|html)/i.test(data)
        if (!isHtml) {
            return { status, isNetwork: false, text: data.trim(), fields: [] }
        }
    }

    if (!data || typeof data !== "object") {
        return {
            status,
            isNetwork: false,
            text:
                status === 403 ? "Bu amal uchun ruxsatingiz yo'q (403)."
                : status === 401 ? "Sessiya tugagan (401). Qaytadan kiring."
                : status === 404 ? "So'ralgan ma'lumot serverda topilmadi (404)."
                : "Xatolik yuz berdi.",
            fields: [],
        }
    }

    // Massiv shaklidagi javob: ["...", "..."]
    if (Array.isArray(data)) {
        const texts = leafTexts(data).map((t) => translateMessage(t))
        return {
            status,
            isNetwork: false,
            text: texts.join("\n") || "Xatolik yuz berdi.",
            fields: [],
        }
    }

    const record = data as Record<string, unknown>

    // Maydon xatolari — formada aynan maydon ostida ko'rsatish uchun.
    const fields: ApiFieldError[] = []
    for (const [key, value] of Object.entries(record)) {
        if (key === "detail" || key === "non_field_errors") continue
        if (DIAGNOSTIC_KEYS.has(key)) continue
        collectFields(value, key, fields, 0)
    }

    // 1-ustuvorlik: `detail` — backend tayyorlagan to'liq jumla.
    const detailText = leafTexts(record.detail)
        .map((t) => translateMessage(t))
        .filter(Boolean)
        .join(" ")

    const nonFieldText = leafTexts(record.non_field_errors)
        .map((t) => translateMessage(t))
        .filter(Boolean)
        .join(" ")

    const lines: string[] = []
    if (detailText) lines.push(detailText)
    if (nonFieldText && nonFieldText !== detailText) lines.push(nonFieldText)

    // `detail` bo'lsa maydon xatolari toastga takror yozilmaydi — u yerda
    // hammasi aytilgan; maydon xatolari baribir formaga o'rnatiladi.
    if (!detailText) {
        for (const f of fields) {
            if (f.message) lines.push(f.message)
        }
    }

    return {
        status,
        isNetwork: false,
        text: lines.filter(Boolean).join("\n") || "Xatolik yuz berdi.",
        fields,
    }
}

/** Faqat matn kerak bo'lganda. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiErrorText = (err: any): string => parseApiError(err).text
