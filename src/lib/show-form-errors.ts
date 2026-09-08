import { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import { parseApiError, translateMessage } from "./api-error-text"
import { fieldLabel } from "./field-labels"

/**
 * Mutatsiya (POST/PATCH/DELETE) xatolarini ko'rsatuvchi umumiy yordamchi.
 *
 * Raund-2 da qayta yozildi. Eski versiya javobning har bir kalitini
 * `String(value)` bilan matnga aylantirardi — obyekt qiymatlar (masalan
 * `used_by: {orders: 1}`, `blocked_by: [{...}]`) ekranda
 * **"used_by: [object Object]"** bo'lib chiqardi va backend tayyorlab bergan
 * to'liq o'zbekcha `detail` jumlasi umuman ko'rsatilmasdi (YANGI-01/High).
 *
 * Endi barcha tahlil `api-error-text.ts` da: u `detail` ni birinchi o'ringa
 * qo'yadi, ichma-ich obyekt/massivlarni to'g'ri ochadi va matni yo'q
 * diagnostika maydonlarini butunlay tashlab yuboradi.
 */

/** Eski nomdagi eksport — mavjud chaqiruvlar buzilmasin. */
export function translateFieldError(key: string, value: unknown): string {
    const label = fieldLabel(key)
    const raw =
        Array.isArray(value) ? value.filter(Boolean).join(", ") : String(value ?? "")
    return translateMessage(raw, label)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleFormError(err: any, form?: UseFormReturn<any>) {
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
                /* noma'lum yo'l — matn baribir toastda ko'rinadi */
            }
        }
    }

    // Toast HAR DOIM chiqadi: maydon ostidagi xabar ekranning ko'rinmaydigan
    // qismida (yoki yopiq modalda) qolib ketishi mumkin, shuning uchun
    // sabab hech bo'lmaganda bir joyda albatta ko'rinsin.
    toast.error(info.text, { duration: 5000 })
}
