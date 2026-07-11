export type Option = { id: number; name: string }

export const CLIENT_OPTIONS: Option[] = [
    { id: 1, name: "IMB Logistics" },
    { id: 2, name: "Asia Trans" },
    { id: 3, name: "UzTrans Cargo" },
    { id: 4, name: "Silk Road Express" },
]

export const LOCATION_OPTIONS: Option[] = [
    { id: 1, name: "Toshkent" },
    { id: 2, name: "Samarqand" },
    { id: 3, name: "Buxoro" },
    { id: 4, name: "Andijon" },
    { id: 5, name: "Farg'ona" },
    { id: 6, name: "Namangan" },
    { id: 7, name: "Nukus" },
]

export const CARGO_TYPE_OPTIONS: Option[] = [
    { id: 1, name: "Oziq-ovqat" },
    { id: 2, name: "Qurilish materiallari" },
    { id: 3, name: "Texnika" },
    { id: 4, name: "Kiyim-kechak" },
    { id: 5, name: "Neft mahsulotlari" },
]

export const PAYMENT_TYPE_OPTIONS: Option[] = [
    { id: 1, name: "Naqd" },
    { id: 2, name: "Plastik" },
    { id: 3, name: "Bank o'tkazmasi" },
]

export const CURRENCY_OPTIONS: Option[] = [
    { id: 1, name: "UZS - So'm" },
    { id: 2, name: "USD - AQSh dollari" },
]

export const findName = (arr: Option[], id: number | null | undefined) =>
    arr.find((i) => i.id === id)?.name ?? "-"
