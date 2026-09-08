import type { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

/**
 * Backend (DRF) xato xabarlarini o'zbekchaga o'giradi.
 *
 * Sabab: DRF xatolari inglizcha va texnik maydon nomi bilan keladi
 * (masalan `amount: Amount must be greater than zero.`), interfeysning
 * qolgan qismi esa o'zbekcha. Bu yordamchi xabarni tarjima qiladi va
 * imkoni bo'lsa xatoni aynan maydon ostida ko'rsatadi.
 */

const FIELD_LABELS: Record<string, string> = {
    amount: "Summa",
    quantity: "Miqdor",
    currency: "Valyuta",
    currency_course: "Valyuta kursi",
    comment: "Izoh",
    product: "Mahsulot",
    vehicle: "Avtomobil",
    order: "Buyurtma",
    driver: "Haydovchi",
    station: "Zapravka",
    receipt: "Chek",
    fuel_type: "Yoqilg'i turi",
}

const MESSAGE_RULES: { test: RegExp; uz: string }[] = [
    {
        test: /greater than zero|must be positive|should be positive|>\s*0/i,
        uz: "Qiymat noldan katta bo'lishi kerak.",
    },
    {
        test: /insufficient|not enough|exceeds? (the )?(available|balance|stock|quantity)/i,
        uz: "Mavjud qoldiq yetarli emas.",
    },
    {
        test: /ensure this value is greater than or equal to/i,
        uz: "Qiymat juda kichik.",
    },
    {
        test: /ensure this value is less than or equal to/i,
        uz: "Qiymat ruxsat etilgan chegaradan oshib ketdi.",
    },
    {
        test: /no more than \d+ decimal place/i,
        uz: "Kasr qismi 2 xonadan oshmasligi kerak.",
    },
    {
        test: /ensure that there are no more than \d+ digits/i,
        uz: "Son juda katta — xonalar soni chegaradan oshdi.",
    },
    {
        test: /may not be (blank|null)|this field is required|is required/i,
        uz: "Bu maydonni to'ldirish shart.",
    },
    {
        test: /a valid (number|integer|decimal) is required|enter a (number|valid)/i,
        uz: "To'g'ri son kiriting.",
    },
    {
        test: /valid date|date has wrong format/i,
        uz: "Sana formati noto'g'ri.",
    },
    {
        test: /object with .* does not exist|not found|invalid pk/i,
        uz: "Tanlangan ma'lumot topilmadi.",
    },
    {
        test: /permission|not allowed|forbidden|credentials/i,
        uz: "Bu amal uchun ruxsatingiz yo'q.",
    },
    {
        test: /already exists|must be unique/i,
        uz: "Bunday yozuv allaqachon mavjud.",
    },
]

const flatten = (value: unknown): string => {
    if (value == null) return ""
    if (Array.isArray(value)) return value.map(flatten).filter(Boolean).join(" ")
    if (typeof value === "object") {
        return Object.values(value as Record<string, unknown>)
            .map(flatten)
            .filter(Boolean)
            .join(" ")
    }
    return String(value)
}

/** Bitta inglizcha xabarni o'zbekchaga o'giradi (mos qoida topilmasa asl matn). */
export const translateApiMessage = (raw: unknown): string => {
    const text = flatten(raw).trim()
    if (!text) return ""
    const rule = MESSAGE_RULES.find((r) => r.test.test(text))
    return rule ? rule.uz : text
}

const isUzbek = (text: string) => /[a-zA-Z]/.test(text) === false

/**
 * Xatoni o'zbekcha ko'rsatadi.
 * `form` berilsa xabar mos maydon ostida ham chiqadi (faqat toast emas).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const showUzApiError = (err: any, form?: UseFormReturn<any>) => {
    const status = Number(err?.response?.status ?? err?.status ?? 0)

    if (!err?.response) {
        toast.error(
            "Server bilan bog'lanib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.",
            { duration: 5000 },
        )
        return
    }
    if (status >= 500) {
        toast.error("Serverda xatolik yuz berdi. Keyinroq qayta urinib ko'ring.", {
            duration: 5000,
        })
        return
    }

    const data = err?.response?.data
    if (!data || typeof data !== "object") {
        toast.error("Xatolik yuz berdi.", { duration: 5000 })
        return
    }

    const messages: string[] = []
    const formFields = form ? form.getValues() : null

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        const uz = translateApiMessage(value)
        if (!uz) continue

        if (key === "detail" || key === "non_field_errors") {
            messages.push(uz)
            continue
        }

        if (formFields && key in formFields) {
            form?.setError(key, { type: "server", message: uz })
        }
        const label = FIELD_LABELS[key]
        messages.push(label ? `${label}: ${uz}` : uz)
    }

    if (messages.length === 0) {
        toast.error("Xatolik yuz berdi.", { duration: 5000 })
        return
    }
    toast.error(messages.join("\n"), { duration: 5000 })
}

/** Faqat matn kerak bo'lganda (toast'siz). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uzApiErrorText = (err: any): string => {
    if (!err?.response) return "Server bilan bog'lanib bo'lmadi."
    const status = Number(err?.response?.status ?? 0)
    if (status >= 500) return "Serverda xatolik yuz berdi."
    const data = err?.response?.data
    const text = translateApiMessage(data)
    if (!text) return "Xatolik yuz berdi."
    return isUzbek(text) ? text : text
}
