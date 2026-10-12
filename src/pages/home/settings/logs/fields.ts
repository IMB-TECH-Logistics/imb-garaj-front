import i18n from "@/i18n/i18n"

const lookupField = (key: string): string | undefined => {
    const path = `settings.logs.fields.${key}`
    return i18n.exists(path) ? i18n.t(path) : undefined
}

const ID_SUFFIX_RE = /_id$/

// USD olib tashlangan: valyuta maydonlari tafsilotda ko'rsatilmaydi (eski log kalitlari saqlanadi)
const HIDDEN_FIELDS = new Set(["currency", "currency_course"])

export const isHiddenField = (field: string): boolean =>
    HIDDEN_FIELDS.has(field.toString().trim().toLowerCase())

const titleCase = (s: string) =>
    s
        .split("_")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")

export const getFieldLabel = (field: string): string => {
    if (!field) return field
    const key = field.toString().trim().toLowerCase()
    const found = lookupField(key)
    if (found) return found
    const dehyphened = key.replace(/-/g, "_")
    const foundDehyphened = lookupField(dehyphened)
    if (foundDehyphened) return foundDehyphened
    if (ID_SUFFIX_RE.test(key)) {
        const base = key.replace(ID_SUFFIX_RE, "")
        const foundBase = lookupField(base)
        if (foundBase) return foundBase
    }
    return titleCase(key)
}
