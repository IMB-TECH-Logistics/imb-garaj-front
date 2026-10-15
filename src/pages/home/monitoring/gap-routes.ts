import { useQuery } from "@tanstack/react-query"

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving"
const MIN_GAP_M = 1000
const MAX_GAPS = 25

type GapPoint = { t: number; lat: number; lng: number }
export type Gap = { from: GapPoint; to: GapPoint }

function metres(a: GapPoint, b: GapPoint) {
    const r = Math.PI / 180
    const h =
        Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
        Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2
    return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

export const gapKey = (g: Gap) => `${g.from.t}:${g.to.t}`

export function findGaps<T extends GapPoint>(points: T[], gapMs: number): Gap[] {
    const gaps: Gap[] = []
    for (let i = 1; i < points.length && gaps.length < MAX_GAPS; i++) {
        const a = points[i - 1]
        const b = points[i]
        if (b.t - a.t > gapMs && metres(a, b) >= MIN_GAP_M) gaps.push({ from: a, to: b })
    }
    return gaps
}

async function roadBetween(gap: Gap): Promise<[number, number][]> {
    const coords = `${gap.from.lng},${gap.from.lat};${gap.to.lng},${gap.to.lat}`
    const res = await fetch(`${OSRM_URL}/${coords}?overview=full&geometries=geojson`)
    if (!res.ok) return []
    const body = await res.json()
    const line: [number, number][] | undefined = body?.routes?.[0]?.geometry?.coordinates
    return line && line.length > 2 ? line.slice(1, -1) : []
}

export function useGapRoutes(gaps: Gap[]) {
    const key = gaps.map(gapKey).join(",")
    const query = useQuery({
        queryKey: ["gps-gap-routes", key],
        enabled: gaps.length > 0,
        staleTime: Infinity,
        gcTime: 30 * 60 * 1000,
        retry: false,
        queryFn: async () => {
            const lines = await Promise.all(gaps.map((g) => roadBetween(g).catch(() => [])))
            return new Map(gaps.map((g, i) => [gapKey(g), lines[i]]))
        },
    })
    return query.data
}
