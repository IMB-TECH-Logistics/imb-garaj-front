import type { LiveMarker } from "./route-map"

export type MarkerCluster = {
    id: string
    lat: number
    lng: number
    members: LiveMarker[]
}

export const CLUSTER_RADIUS_PX = 30
export const SPREAD_ZOOM = 18

const worldPixel = (lat: number, lng: number, scale: number) => {
    const sin = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999)
    return {
        x: ((lng + 180) / 360) * scale,
        y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
    }
}

export function clusterMarkers(
    markers: LiveMarker[],
    zoom: number,
    tileSize = 256,
    radius = CLUSTER_RADIUS_PX,
) {
    const scale = tileSize * 2 ** zoom
    const points = markers.map((m) => ({ m, ...worldPixel(m.lat, m.lng, scale) }))
    const used = new Set<number>()
    const singles: LiveMarker[] = []
    const clusters: MarkerCluster[] = []
    points.forEach((p, i) => {
        if (used.has(i)) return
        used.add(i)
        if (p.m.selected) {
            singles.push(p.m)
            return
        }
        const group = [p]
        points.forEach((q, j) => {
            if (used.has(j) || q.m.selected) return
            if (Math.hypot(q.x - p.x, q.y - p.y) <= radius) {
                used.add(j)
                group.push(q)
            }
        })
        if (group.length === 1) {
            singles.push(p.m)
            return
        }
        const members = group.map((g) => g.m)
        clusters.push({
            id: members.map((m) => String(m.id)).sort().join("|"),
            lat: members.reduce((s, m) => s + m.lat, 0) / members.length,
            lng: members.reduce((s, m) => s + m.lng, 0) / members.length,
            members,
        })
    })
    return { singles, clusters }
}

export function separatesAt(members: LiveMarker[], zoom: number, tileSize = 256) {
    const plain = members.map((m) => ({ ...m, selected: false }))
    const { clusters } = clusterMarkers(plain, zoom, tileSize)
    return !(clusters.length === 1 && clusters[0].members.length === members.length)
}
