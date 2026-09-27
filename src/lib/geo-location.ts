type GeoPoint = {
    lat: number
    lng: number
    accuracy: number
}

const STORAGE_KEY = "geo:last"
const ASKED_KEY = "geo:asked"

let current: GeoPoint | null = readStored()
let started = false

function readStored(): GeoPoint | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as GeoPoint
        if (Number.isFinite(parsed?.lat) && Number.isFinite(parsed?.lng)) return parsed
    } catch {
        return null
    }
    return null
}

function save(point: GeoPoint) {
    current = point
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(point))
    } catch {
        return
    }
}

function markAsked(): boolean {
    try {
        if (sessionStorage.getItem(ASKED_KEY)) return false
        sessionStorage.setItem(ASKED_KEY, "1")
    } catch {
        return true
    }
    return true
}

export function startGeoTracking() {
    if (started) return
    started = true
    if (typeof window === "undefined" || !window.isSecureContext) return
    if (!("geolocation" in navigator)) return

    const watch = () => {
        navigator.geolocation.watchPosition(
            (pos) =>
                save({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: Math.round(pos.coords.accuracy),
                }),
            (err) => {
                if (err.code === err.PERMISSION_DENIED) current = null
            },
            { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 30 * 1000 },
        )
    }

    const permissions = navigator.permissions
    if (!permissions?.query) {
        if (markAsked() || current) watch()
        return
    }
    permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
            if (status.state === "granted") watch()
            else if (status.state === "prompt" && markAsked()) watch()
        })
        .catch(() => {
            if (markAsked()) watch()
        })
}

export function getGeoHeaders(): Record<string, string> {
    if (!current) return {}
    return {
        "X-Geo-Lat": current.lat.toFixed(6),
        "X-Geo-Lng": current.lng.toFixed(6),
        "X-Geo-Accuracy": String(current.accuracy),
    }
}
