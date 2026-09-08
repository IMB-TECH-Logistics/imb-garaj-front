import { ClassNameValue } from "tailwind-merge"

/**
 * "Ma'lumot yo'q" belgisi.
 *
 * NEGA NOL EMAS: ilgari qiymat kelmaganda (`undefined`, `null`, bo'sh satr yoki
 * son bo'lmagan matn) bu funksiya jimgina **0** chizardi. Server o'chganda esa
 * sahifalarning aksariyati aynan `undefined` uzatadi — natijada foydalanuvchi
 * "Ro'yxat 0", "Balans 0 so'm" degan YOLG'ON raqamni haqiqat deb o'qirdi.
 *
 * "Ma'lumot yo'q" bilan "qiymati nol" — bir xil narsa emas. Haqiqiy nol
 * (`0` yoki `"0"`) avvalgidek "0" bo'lib chiziladi; faqat qiymatning O'ZI
 * yo'q bo'lgan holat shu belgi bilan ajratiladi.
 */
export const NO_VALUE = "—"

/**
 * Qiymat umuman berilmaganmi (nol EMAS, balki yo'q)?
 *
 * Chegara ATAYLAB tor — faqat `undefined`. Sabab: `undefined` "obyektning o'zi
 * yo'q" degani (`data?.count` — so'rov yiqilgan yoki hali kelmagan), ya'ni
 * aynan yolg'on nol chiqadigan holat.
 *
 * `null` esa BOSHQA narsa: server javob berdi va maydonni ochiq-oydin bo'sh
 * deb belgiladi (masalan `/dashboard/main-statistic` reysi bo'lmagan mashina
 * uchun `income: null` qaytaradi — bu "daromad nol" degani). Shuning uchun
 * `null`, bo'sh satr va son bo'lmagan qiymatlar avvalgidek "0" bo'lib
 * chiziladi — mavjud jadvallarning ko'rinishi o'zgarmaydi.
 */
const isMissing = (amount?: number | string) => amount === undefined

export function formatMoney(
    amount?: number | string,
    className?: ClassNameValue,
    suffix?: boolean,
) {
    if (isMissing(amount)) {
        return (
            <span
                className={`${className} text-nowrap`}
                title="Ma'lumot yuklanmadi"
            >
                {NO_VALUE}
            </span>
        )
    }

    const numeric = Number(amount)
    // Round doubles to at most two figures after the comma, trimming trailing zeros.
    // Son bo'lmagan qiymat (NaN) avvalgidek 0 bo'lib qoladi.
    const rounded = Number.isFinite(numeric)
        ? Math.round(numeric * 100) / 100
        : 0
    const [integerPart, decimalPart] = Math.abs(rounded).toString().split(".")
    const newIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    const sign = rounded < 0 ? "-" : ""
    const text =
        sign + newIntegerPart + (decimalPart ? `.${decimalPart}` : "")
    return (
        <span className={`${className} text-nowrap`}>
            {text} {suffix ? " so'm" : ""}
        </span>
    )
}
