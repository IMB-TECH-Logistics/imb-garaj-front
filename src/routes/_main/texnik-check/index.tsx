import { createFileRoute, redirect } from "@tanstack/react-router"

/**
 * B-34 tuzatildi: yetim (takroriy) marshrut `/texnik-check`.
 *
 * NIMA BUZUQ EDI: bitta sahifa (`TexnikCheck`) ikkita manzilda ochilardi —
 * `/technic-check` (to'g'ri manzil: Meneger tablari bilan, yon menyuda
 * belgilanadi) va `/texnik-check` (menyuda yo'q, tablarsiz, sidebar
 * belgilanmaydi). Eski havola yoki qo'lda yozilgan URL orqali `/texnik-check`
 * ga tushgan foydalanuvchi navigatsiyasiz — boshi berk ko'chada qolardi.
 *
 * NEGA SHUNDAY TUZATILDI: marshrut o'chirilmadi (eski havolalar buzilmasin
 * uchun), balki `beforeLoad` da `/technic-check` ga yo'naltiriladi. Shunday
 * qilib eski manzil ishlashda davom etadi, lekin foydalanuvchi doim to'liq
 * navigatsiyali sahifaga tushadi. `beforeLoad` lazy faylda ishlamaydi, shu
 * sabab shu oddiy (lazy bo'lmagan) marshrut fayli yaratildi.
 *
 * `search` o'zgarishsiz uzatiladi — mavjud filtr/qidiruv parametrlari
 * (sana oralig'i, sahifa va h.k.) yo'qolmaydi. `replace: true` — brauzer
 * "orqaga" tugmasi foydalanuvchini yana shu redirectga qaytarmasligi uchun.
 */
export const Route = createFileRoute("/_main/texnik-check/")({
    beforeLoad: ({ search }) => {
        throw redirect({
            to: "/technic-check",
            search,
            replace: true,
        })
    },
})
