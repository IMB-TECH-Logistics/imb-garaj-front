import { TFunction } from "i18next"

export function monthsSince(value?: string | null): number | null {
    if (!value) return null
    const [year, month, day] = value.slice(0, 10).split("-").map(Number)
    if (!year || !month || !day) return null
    const today = new Date()
    let months =
        (today.getFullYear() - year) * 12 + (today.getMonth() + 1 - month)
    if (today.getDate() < day) months -= 1
    return Math.max(months, 0)
}

export function formatExperience(
    t: TFunction,
    months?: number | null,
    fallbackYears?: number | string | null,
): string {
    if (months === null || months === undefined) {
        const years = Number(fallbackYears ?? 0) || 0
        if (years <= 0) return "-"
        months = Math.round(years * 12)
        if (months === 0) return "-"
    }
    const years = Math.floor(months / 12)
    const rest = months % 12
    const parts: string[] = []
    if (years > 0) parts.push(t("form.experience_years", { count: years }))
    if (rest > 0 || years === 0)
        parts.push(t("form.experience_months", { count: rest }))
    return parts.join(" ")
}
