import type { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import { apiErrorText, parseApiError, translateMessage } from "./api-error-text"

/**
 * Backend (DRF) xato xabarlarini o'zbekchaga o'giradi.
 *
 * Raund-2: bu modul endi mustaqil emas — barcha tahlil `api-error-text.ts`
 * da bajariladi, bu yerda faqat ko'rsatish (toast + maydon) qoldi.
 * Sabab: ilgari ikki xil tahlilchi bor edi va ular boshqacha ishlardi —
 * biri obyekt qiymatni `[object Object]` qilib chizardi, ikkinchisi
 * `detail` ni umuman o'qimasdi. Endi ikkalasi bitta manbadan oziqlanadi.
 */

/** Bitta xabarni o'zbekchaga o'girish (mos qoida topilmasa — asl matn). */
export const translateApiMessage = (raw: unknown): string => {
    if (raw === null || raw === undefined) return ""
    if (typeof raw === "string") return translateMessage(raw)
    // Obyekt/massiv bo'lsa — umumiy tahlilchidan foydalanamiz.
    return parseApiError({ response: { status: 400, data: raw } }).text
}

/**
 * Xatoni o'zbekcha ko'rsatadi.
 * `form` berilsa xabar mos maydon ostida ham chiqadi (faqat toast emas).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const showUzApiError = (err: any, form?: UseFormReturn<any>) => {
    const info = parseApiError(err)

    if (form) {
        for (const field of info.fields) {
            if (!field.message) continue
            try {
                form.setError(field.path as never, {
                    type: "server",
                    message: field.message,
                })
            } catch {
                /* noma'lum yo'l — matn toastda ko'rinadi */
            }
        }
    }

    toast.error(info.text, { duration: 5000 })
}

/** Faqat matn kerak bo'lganda (toast'siz). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uzApiErrorText = (err: any): string => apiErrorText(err)
