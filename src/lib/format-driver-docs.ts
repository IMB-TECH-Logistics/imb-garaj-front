const DOC_PATTERN = /^([A-Za-z]{2})\s*(\d{7})$/

export function normalizeDocNumber(value: unknown): string {
    return String(value ?? "")
        .replace(/\s+/g, "")
        .toUpperCase()
}

export function formatPassportSerial(value?: string | null): string {
    const raw = String(value ?? "").trim()
    const match = raw.match(DOC_PATTERN)
    if (!match) return raw
    const digits = match[2]
    return `${match[1].toUpperCase()} ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`
}

export function formatDriverLicense(value?: string | null): string {
    const raw = String(value ?? "").trim()
    const match = raw.match(DOC_PATTERN)
    if (!match) return raw
    return `${match[1].toUpperCase()} ${match[2]}`
}
