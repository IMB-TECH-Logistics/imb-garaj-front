import { format, parseISO } from "date-fns"

export const fmtDate = (value?: string | null) =>
    value ? format(parseISO(value), "dd/MM/yyyy") : "—"

export const todayISO = () => format(new Date(), "yyyy-MM-dd")

export const isPast = (value?: string | null) =>
    !!value && value < todayISO()

export const toNumber = (value: string | number | null | undefined) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

const toCents = (value: string | number | null | undefined) =>
    BigInt(Math.round(toNumber(value) * 100))

// Backend bilan bir xil (ReceiptService.create): qator summasi = miqdor × narx,
// Decimal.quantize(0.01) — ROUND_HALF_EVEN. Natija tiyinda (BigInt, aniq).
export const lineAmountCents = (
    quantity: string | number | null | undefined,
    unitPrice: string | number | null | undefined,
): bigint => {
    const raw = toCents(quantity) * toCents(unitPrice) // 0.0001 birlikda
    const sign = raw < 0n ? -1n : 1n
    const abs = raw * sign
    const q = abs / 100n
    const r = abs % 100n
    const rounded = r > 50n || (r === 50n && q % 2n === 1n) ? q + 1n : q
    return rounded * sign
}

export const centsToNumber = (cents: bigint) => Number(cents) / 100

export const collectErrors =(data: unknown): string[] => {
    if (typeof data === "string") return [data]
    if (Array.isArray(data)) return data.flatMap(collectErrors)
    if (data && typeof data === "object") {
        return Object.values(data).flatMap(collectErrors)
    }
    return []
}
