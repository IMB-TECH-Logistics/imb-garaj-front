export const LIVE_REFRESH_MS = 30_000
export const GPS_REFRESH_MS = 10_000
export const GPS_FALLBACK_MS = 60_000

export const num = (v: unknown): number | null => {
    if (v === undefined || v === null || v === "") return null
    const n = Number(v)
    return Number.isNaN(n) ? null : n
}
