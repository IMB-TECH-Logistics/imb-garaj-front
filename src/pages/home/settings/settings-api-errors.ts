import { toast } from "sonner"

/**
 * Server-side validation errors for DB unique constraints come back as raw,
 * untranslated DRF text keyed by field name, e.g.
 *   { "username": ["user with this Username already exists."] }
 * The shared `handleFormError` helper renders that verbatim, so the user of an
 * otherwise fully Uzbek UI sees `username: user with this Username already
 * exists.` (UI audit finding S1-09).
 *
 * This module is a browser-side stop-gap: it recognises the known English
 * shapes and shows an Uzbek sentence instead. The real fix belongs on the
 * server — see `tuzatish-20260908/backend-kerak/F3.md` (S1-09).
 */

/** Uzbek label for each field name the settings forms can send. */
const FIELD_LABELS: Record<string, string> = {
    name: "Nom",
    username: "Login",
    truck_number: "Avtomobil raqami",
    trailer_number: "Tirkama raqami",
    truck_passport: "Tex passport",
    password: "Parol",
    first_name: "Ism",
    last_name: "Familiya",
    year: "Yili",
    consumption: "Sarfi",
    price: "Summa",
    amount: "Summa",
    experience: "Ish staji",
    pinfl: "PINFL",
    passport_serial: "Pasport raqami",
    driver_license: "Guvohnoma raqami",
    driver_license_date: "Guvohnoma muddati",
    load: "Yuklash manzili",
    unload: "Yuk tushirish manzili",
    valid_from: "Amal qilish sanasi",
    non_field_errors: "",
    detail: "",
}

const label = (field: string): string =>
    FIELD_LABELS[field] ?? FIELD_LABELS[field.split(".").pop() ?? ""] ?? field

/** English DRF/Django messages → Uzbek, in match order. */
const RULES: Array<{ test: RegExp; uz: (field: string, m: RegExpMatchArray) => string }> = [
    {
        test: /already exists/i,
        uz: (f) => `Bu ${label(f).toLowerCase()} allaqachon mavjud — boshqasini kiriting`,
    },
    {
        test: /must be unique/i,
        uz: (f) => `Bu ${label(f).toLowerCase()} allaqachon mavjud — boshqasini kiriting`,
    },
    {
        test: /no more than (\d+) characters/i,
        uz: (f, m) => `${label(f)} ${m[1]} ta belgidan oshmasligi kerak`,
    },
    {
        test: /at least (\d+) characters/i,
        uz: (f, m) => `${label(f)} kamida ${m[1]} ta belgi bo'lishi kerak`,
    },
    {
        test: /greater than or equal to ([\d.-]+)/i,
        uz: (f, m) => `${label(f)} ${m[1]} dan kichik bo'lmasligi kerak`,
    },
    {
        test: /less than or equal to ([\d.-]+)/i,
        uz: (f, m) => `${label(f)} ${m[1]} dan katta bo'lmasligi kerak`,
    },
    { test: /this field may not be blank/i, uz: (f) => `${label(f)}ni kiriting` },
    { test: /this field is required/i, uz: (f) => `${label(f)}ni kiriting` },
    { test: /a valid number is required/i, uz: (f) => `${label(f)} raqam bo'lishi kerak` },
    { test: /a valid integer is required/i, uz: (f) => `${label(f)} butun son bo'lishi kerak` },
    {
        test: /invalid pk|object does not exist/i,
        uz: (f) => `Tanlangan ${label(f).toLowerCase()} topilmadi (o'chirilgan bo'lishi mumkin)`,
    },
]

const translateOne = (field: string, raw: string): string => {
    for (const rule of RULES) {
        const m = raw.match(rule.test)
        if (m) return rule.uz(field, m)
    }
    // Unknown English text: at least drop the bare `field:` prefix and keep it
    // readable rather than inventing a wrong translation.
    return label(field) ? `${label(field)}: ${raw}` : raw
}

/**
 * Per-mutation `onError` for the settings forms. Pass it as the third argument
 * of `usePost`/`usePatch`'s `mutate`, e.g.
 *
 *   postMutate(URL, values, { onError: showSettingsApiError })
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const showSettingsApiError = (err: any): void => {
    const status = Number(err?.status ?? err?.response?.status)
    const data = err?.response?.data

    if (!data || status >= 500 || Number.isNaN(status)) {
        toast.error("Serverda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.", {
            duration: 5000,
        })
        return
    }

    if (typeof data === "string") {
        toast.error(data, { duration: 5000 })
        return
    }

    const messages: string[] = []
    for (const [field, value] of Object.entries(data)) {
        const raws = Array.isArray(value) ? value : [value]
        for (const raw of raws) {
            if (typeof raw === "string") messages.push(translateOne(field, raw))
        }
    }

    toast.error(messages.length ? messages.join("\n") : "Xatolik yuz berdi", {
        duration: 5000,
    })
}
