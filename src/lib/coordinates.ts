export type Point = { lat: number; lng: number }

const NUMBER = /-?\d+(?:[.,]\d+)?/g

export const parseCoordinates = (text?: string | null): Point | null => {
    const parts = (text ?? "").match(NUMBER)
    if (!parts || parts.length !== 2) return null
    const [lat, lng] = parts.map((p) => Number(p.replace(",", ".")))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
}

export const formatCoordinates = (lat?: number | null, lng?: number | null) =>
    lat == null || lng == null ? "" : `${lat}, ${lng}`

export const googleMapsUrl = (lat: number, lng: number) =>
    `https://www.google.com/maps?q=${lat},${lng}`
