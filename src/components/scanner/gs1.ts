const SYMBOLOGY_PREFIXES = ["]d2", "]Q3", "]C1", "]e0", "]d1"]
export const GS = "\x1d"

const FIXED: Record<string, number> = { "01": 14, "11": 6, "17": 6 }
const VARIABLE: Record<string, number> = { "10": 20, "21": 20 }
const CRYPTO = ["91", "92", "93"]

export type Gs1Error = {
    key: string
    params?: Record<string, string | number>
}

export type Gs1Result = {
    gtin: string | null
    lot: string | null
    producedAt: string | null
    expiresAt: string | null
    serial: string | null
    raw: string
    errors: Gs1Error[]
}

const checkDigitOk = (gtin: string) => {
    if (gtin.length !== 14 || !/^\d+$/.test(gtin)) return false
    let total = 0
    const digits = gtin.slice(0, -1).split("").reverse()
    digits.forEach((char, index) => {
        total += Number(char) * (index % 2 === 0 ? 3 : 1)
    })
    return (10 - (total % 10)) % 10 === Number(gtin[gtin.length - 1])
}

const pad = (value: number, size = 2) => String(value).padStart(size, "0")

const parseDate = (
    value: string,
    label: string,
    errors: Gs1Error[],
): string | null => {
    if (value.length !== 6 || !/^\d+$/.test(value)) {
        errors.push({ key: "bad_date", params: { label, value } })
        return null
    }
    const yy = Number(value.slice(0, 2))
    const mm = Number(value.slice(2, 4))
    let dd = Number(value.slice(4))
    if (mm < 1 || mm > 12) {
        errors.push({ key: "bad_month", params: { label, value } })
        return null
    }
    const currentYear = new Date().getFullYear()
    let year = currentYear - (currentYear % 100) + yy
    if (year > currentYear + 50) year -= 100
    else if (year <= currentYear - 50) year += 100
    const lastDay = new Date(year, mm, 0).getDate()
    if (dd === 0) dd = lastDay
    if (dd > lastDay) {
        errors.push({ key: "bad_day", params: { label, value } })
        return null
    }
    return `${pad(year, 4)}-${pad(mm)}-${pad(dd)}`
}

const stripPrefix = (code: string) => {
    const prefix = SYMBOLOGY_PREFIXES.find((p) => code.startsWith(p))
    return prefix ? code.slice(prefix.length) : code
}

const splitBracketed = (code: string): [string, string][] =>
    Array.from(code.matchAll(/\((\d{2,4})\)([^(]*)/g)).map((m) => [
        m[1],
        m[2].split(GS).join(""),
    ])

const splitPlain = (code: string, errors: Gs1Error[]): [string, string][] => {
    const pairs: [string, string][] = []
    let pos = 0
    const size = code.length
    while (pos < size) {
        if (code[pos] === GS) {
            pos += 1
            continue
        }
        const ai = code.slice(pos, pos + 2)
        if (ai in FIXED) {
            const end = pos + 2 + FIXED[ai]
            pairs.push([ai, code.slice(pos + 2, end)])
            pos = end
        } else if (ai in VARIABLE || CRYPTO.includes(ai)) {
            let end = code.indexOf(GS, pos + 2)
            const terminated = end !== -1
            if (!terminated) end = size
            const value = code.slice(pos + 2, end)
            if (CRYPTO.includes(ai)) {
                pos = end
                continue
            }
            if (!terminated && ai === "10" && /21./.test(value.slice(1))) {
                errors.push({ key: "missing_gs" })
            }
            pairs.push([ai, value])
            pos = end
        } else {
            errors.push({ key: "unknown_ai", params: { ai, pos } })
            break
        }
    }
    return pairs
}

export const parseGs1 = (code: string): Gs1Result => {
    const result: Gs1Result = {
        gtin: null,
        lot: null,
        producedAt: null,
        expiresAt: null,
        serial: null,
        raw: code,
        errors: [],
    }
    const errors = result.errors
    const text = stripPrefix((code || "").replace(/^[\r\n ]+|[\r\n ]+$/g, ""))
    if (!text) {
        errors.push({ key: "empty" })
        return result
    }

    let pairs: [string, string][]
    if (text.startsWith("(")) {
        pairs = splitBracketed(text).filter(([ai]) => !CRYPTO.includes(ai))
        if (!pairs.length) errors.push({ key: "unknown_format" })
    } else {
        pairs = splitPlain(text, errors)
    }

    for (const [ai, value] of pairs) {
        if (ai === "01") {
            if (!checkDigitOk(value)) {
                errors.push({ key: "bad_gtin", params: { value } })
            }
            result.gtin = value
        } else if (ai === "10") {
            if (value.length > 20) errors.push({ key: "lot_too_long" })
            result.lot = value.slice(0, 20)
        } else if (ai === "21") {
            if (value.length > 20) errors.push({ key: "serial_too_long" })
            result.serial = value.slice(0, 20)
        } else if (ai === "11") {
            result.producedAt = parseDate(value, "11", errors)
        } else if (ai === "17") {
            result.expiresAt = parseDate(value, "17", errors)
        }
    }

    if (result.gtin === null) errors.push({ key: "no_gtin" })
    return result
}
