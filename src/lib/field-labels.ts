/**
 * Maydonning ichki (texnik) nomi → foydalanuvchi ko'radigan o'zbekcha yorliq.
 *
 * Nega bitta joyda: xato matnlari uch xil joyda quriladi —
 *   1) forma komponentlari (`FormCombobox`, `FormInput`) `required` xabari,
 *   2) backend qaytargan maydon xatolari (`api-error-text.ts`),
 *   3) toast yordamchilari.
 * Ilgari har biri o'z ro'yxatini yuritardi, natijada `label` berilmagan
 * maydonda foydalanuvchi ICHKI nomni ko'rardi — masalan "loadingni kiriting",
 * "unloadingni kiriting" (MT-31). Endi barchasi shu jadvaldan o'qiydi.
 */
const FIELD_LABELS: Record<string, string> = {
    // umumiy
    name: "Nomi",
    full_name: "To'liq ismi",
    code: "Kodi",
    comment: "Izoh",
    description: "Izoh",
    detail: "",
    non_field_errors: "",

    // foydalanuvchi / haydovchi
    username: "Login",
    password: "Parol",
    first_name: "Ism",
    last_name: "Familiya",
    phone: "Telefon raqami",
    phone_number: "Telefon raqami",
    role: "Rol",
    roles: "Rol",
    actions: "Ruxsatlar",
    driver: "Haydovchi",
    experience: "Ish staji",
    pinfl: "PINFL",
    passport_serial: "Pasport raqami",
    driver_license: "Guvohnoma raqami",
    driver_license_date: "Guvohnoma muddati",

    // manzil / yo'nalish
    load: "Yuklash manzili",
    loading: "Yuklash manzili",
    unload: "Tushirish manzili",
    unloading: "Tushirish manzili",
    country: "Davlat",
    region: "Viloyat",
    city: "Shahar",
    district: "Tuman",
    direction: "Yo'nalish",
    directions: "Yo'nalish",

    // buyurtma / yuk
    order: "Buyurtma",
    orders: "Buyurtma",
    cargo_type: "Yuk turi",
    cargo_owner: "Yuk egasi",
    customer: "Mijoz",
    trip: "Reys",
    payment_type: "To'lov turi",
    valid_from: "Amal qilish sanasi",

    // transport
    vehicle: "Avtomobil",
    truck_number: "Avtomobil raqami",
    trailer_number: "Tirkama raqami",
    truck_passport: "Tex passport",
    year: "Yili",
    consumption: "Sarfi",
    model: "Model",
    type: "Turi",

    // pul
    amount: "Summa",
    price: "Summa",
    quantity: "Miqdor",
    currency: "Valyuta",
    currency_course: "Valyuta kursi",
    nds_percent: "NDS foizi",
    balance: "Balans",
    station: "Zapravka",
    receipt: "Chek",
    fuel_type: "Yoqilg'i turi",
    product: "Mahsulot",
    flow_type: "Yo'nalishi",
    method: "Usuli",
    date: "Sana",
}

/**
 * Maydon yorlig'i. `driver.phone` kabi ichma-ich nomlar uchun avval to'liq
 * yo'l, keyin oxirgi bo'lagi qidiriladi. Jadvalda bo'lmasa `undefined` —
 * chaqiruvchi o'zi qaror qiladi (ichki nomni ko'rsatmaslik uchun).
 */
export const fieldLabel = (name: string): string | undefined => {
    if (!name) return undefined
    if (name in FIELD_LABELS) return FIELD_LABELS[name] || undefined
    const last = name.split(".").pop() ?? ""
    if (last in FIELD_LABELS) return FIELD_LABELS[last] || undefined
    return undefined
}

/**
 * Ekranda ko'rsatish uchun yorliq. Jadvalda topilmasa — ichki nomni xom
 * holda chiqarish o'rniga hech bo'lmasa `_` larni bo'shliqqa aylantiradi.
 */
export const displayFieldLabel = (name: string, fallbackLabel?: string) => {
    if (fallbackLabel) return fallbackLabel
    const known = fieldLabel(name)
    if (known) return known
    const last = (name || "").split(".").pop() ?? name
    return last.replace(/_/g, " ")
}

export default FIELD_LABELS
