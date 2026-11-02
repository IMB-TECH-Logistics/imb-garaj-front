import "maplibre-gl/dist/maplibre-gl.css"
import maplibregl from "maplibre-gl"
import { useEffect, useMemo, useRef } from "react"
import Map, {
    Layer,
    Marker,
    NavigationControl,
    Source,
    type MapMouseEvent,
    type MapRef,
} from "react-map-gl/maplibre"

export type ZonePoint = { lat: number; lng: number }

type Props = {
    point: ZonePoint | null
    radius: number
    onChange: (point: ZonePoint) => void
    defaultCenter?: ZonePoint | null
}

const DEFAULT_CENTER = { lat: 41.31115, lng: 69.27969 }

const VILOYAT_CENTERS: Record<string, ZonePoint> = {
    toshkent: { lat: 41.31115, lng: 69.27969 },
    andijon: { lat: 40.7821, lng: 72.3442 },
    fargona: { lat: 40.3864, lng: 71.7843 },
    namangan: { lat: 40.9983, lng: 71.6726 },
    samarqand: { lat: 39.6542, lng: 66.9597 },
    buxoro: { lat: 39.7747, lng: 64.4286 },
    navoiy: { lat: 40.0844, lng: 65.3792 },
    qashqadaryo: { lat: 38.8606, lng: 65.7891 },
    surxondaryo: { lat: 37.2242, lng: 67.2783 },
    jizzax: { lat: 40.1158, lng: 67.8422 },
    sirdaryo: { lat: 40.4897, lng: 68.7842 },
    xorazm: { lat: 41.55, lng: 60.6333 },
    qoraqalpogiston: { lat: 42.46, lng: 59.61 },
}

export const viloyatCenter = (name?: string | null): ZonePoint | null => {
    if (!name) return null
    const key = name.toLowerCase().replace(/[^a-z]/g, "")
    return VILOYAT_CENTERS[key] ?? null
}

const RASTER_TILES = (
    import.meta.env.VITE_MAP_RASTER_TILES ||
    "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png," +
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png," +
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
)
    .split(",")
    .map((url: string) => url.trim())
    .filter(Boolean)

const OSM_STYLE: maplibregl.StyleSpecification = {
    version: 8,
    sources: {
        osm: {
            type: "raster",
            tiles: RASTER_TILES,
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
        },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
}

const ZONE_COLOR = "#10b981"
const EARTH_RADIUS = 6371008.8

const circlePolygon = (center: ZonePoint, radius: number, steps = 64) => {
    const lat = (center.lat * Math.PI) / 180
    const lng = (center.lng * Math.PI) / 180
    const d = radius / EARTH_RADIUS
    const ring: [number, number][] = []
    for (let i = 0; i <= steps; i++) {
        const b = (2 * Math.PI * i) / steps
        const pLat = Math.asin(
            Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(b),
        )
        const pLng =
            lng +
            Math.atan2(
                Math.sin(b) * Math.sin(d) * Math.cos(lat),
                Math.cos(d) - Math.sin(lat) * Math.sin(pLat),
            )
        ring.push([(pLng * 180) / Math.PI, (pLat * 180) / Math.PI])
    }
    return {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "Polygon" as const, coordinates: [ring] },
    }
}

const ZoneMap = ({ point, radius, onChange, defaultCenter }: Props) => {
    const mapRef = useRef<MapRef | null>(null)
    const initial = useMemo(() => point ?? defaultCenter ?? DEFAULT_CENTER, [])

    useEffect(() => {
        if (!point) return
        mapRef.current?.panTo([point.lng, point.lat])
    }, [point?.lat, point?.lng])

    useEffect(() => {
        if (point || !defaultCenter) return
        mapRef.current?.jumpTo({
            center: [defaultCenter.lng, defaultCenter.lat],
            zoom: 11,
        })
    }, [defaultCenter?.lat, defaultCenter?.lng])

    const circle = useMemo(
        () => (point && radius > 0 ? circlePolygon(point, radius) : null),
        [point?.lat, point?.lng, radius],
    )

    const pick = (e: MapMouseEvent) =>
        onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng })

    return (
        <div className="h-full overflow-hidden rounded-md border">
            <Map
                ref={mapRef}
                initialViewState={{
                    latitude: initial.lat,
                    longitude: initial.lng,
                    zoom: point ? 13 : 11,
                }}
                mapStyle={OSM_STYLE as any}
                onClick={pick}
                style={{ width: "100%", height: "100%" }}
            >
                <NavigationControl position="top-right" showCompass={false} />
                {circle && (
                    <Source id="zone-circle" type="geojson" data={circle}>
                        <Layer
                            id="zone-circle-fill"
                            type="fill"
                            paint={{ "fill-color": ZONE_COLOR, "fill-opacity": 0.15 }}
                        />
                        <Layer
                            id="zone-circle-line"
                            type="line"
                            paint={{
                                "line-color": ZONE_COLOR,
                                "line-opacity": 0.9,
                                "line-width": 2,
                            }}
                        />
                    </Source>
                )}
                {point && (
                    <Marker
                        latitude={point.lat}
                        longitude={point.lng}
                        draggable
                        onDragEnd={(e) =>
                            onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng })
                        }
                    />
                )}
            </Map>
        </div>
    )
}

export default ZoneMap
