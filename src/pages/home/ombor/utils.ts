import { format, parseISO } from "date-fns"

export const fmtDate = (value?: string | null) =>
    value ? format(parseISO(value), "dd.MM.yyyy") : "—"

export const todayISO = () => format(new Date(), "yyyy-MM-dd")

export const isPast = (value?: string | null) =>
    !!value && value < todayISO()

export const toNumber = (value: string | number | null | undefined) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

export const collectErrors = (data: unknown): string[] => {
    if (typeof data === "string") return [data]
    if (Array.isArray(data)) return data.flatMap(collectErrors)
    if (data && typeof data === "object") {
        return Object.values(data).flatMap(collectErrors)
    }
    return []
}
