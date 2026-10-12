import i18n from "@/i18n/i18n"

const lookupSection = (key: string): string | undefined => {
    const path = `settings.logs.sections.${key}`
    return i18n.exists(path) ? i18n.t(path) : undefined
}

const UZBEK_CHARS_RE = /[ʼ'`]|[a-z]/

const isLikelyUzbek = (s: string) => {
    const lower = s.toLowerCase()
    return [
        "yuklash",
        "tushirish",
        "yo'nalish",
        "haydovchi",
        "mijoz",
        "rey",
        "kassa",
        "tranzaksiya",
        "ombor",
        "buxgalter",
        "moliya",
        "zapravka",
        "texnik",
        "sozlama",
        "avtomobil",
        "tirkama",
        "manzil",
        "viloyat",
        "tuman",
        "yuk",
        "lavozim",
        "smena",
        "davomat",
        "oylik",
    ].some((stem) => lower.includes(stem))
}

export const getSectionLabel = (section: string | null | undefined): string => {
    if (!section) return "—"
    const raw = section.toString().trim()
    if (!raw) return "—"

    const key = raw.toLowerCase().replace(/\s+/g, "_")
    const found =
        lookupSection(key) ??
        lookupSection(key.replace(/_/g, "")) ??
        lookupSection(key.replace(/_/g, "-")) ??
        lookupSection(key.replace(/-/g, "_"))
    if (found) return found

    if (UZBEK_CHARS_RE.test(raw) && isLikelyUzbek(raw)) return raw

    return raw
        .replace(/[_-]+/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (c) => c.toUpperCase())
}
