export const APP_TIME_ZONE = "Asia/Tashkent"

const dayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
})

export function todayIso(now: Date = new Date()) {
    const parts = Object.fromEntries(
        dayParts.formatToParts(now).map((p) => [p.type, p.value]),
    )
    return `${parts.year}-${parts.month}-${parts.day}`
}
