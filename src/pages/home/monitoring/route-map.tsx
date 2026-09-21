import { cn } from "@/lib/utils"
import "maplibre-gl/dist/maplibre-gl.css"
import { useEffect, useMemo, useRef } from "react"
import Map, {
    Layer,
    type MapRef,
    Marker,
    NavigationControl,
    Source,
} from "react-map-gl/maplibre"
import GoogleRouteMap from "./google-route-map"
import { DriverMarker, EndpointDot, PoiMarker } from "./map-markers"

const MAP_STYLE_URL =
    import.meta.env.VITE_MAP_STYLE_URL ||
    "https://tiles.openfreemap.org/styles/positron"

const LOCALIZED_TEXT_FIELD: any = [
    "coalesce",
    ["get", "name:latin"],
    ["get", "name:en"],
    ["get", "name"],
]

const MAP_PROVIDER = import.meta.env.VITE_MAP_PROVIDER

const DEFAULT_CENTER = { lat: 41.31115, lng: 69.27969 }

export type MapPoint = [number, number] // [lng, lat]

export type ColoredSegment = { points: MapPoint[]; color: string }

export type LiveMarker = {
    id: string | number
    lat: number
    lng: number
    label: string
    sub?: string
    stale?: boolean
    selected?: boolean
    icon?: "truck"
    onClick?: () => void
}

export type MapPoi = {
    id: string | number
    lat: number
    lng: number
    kind: "stop" | "replay"
    title?: string
}

export type RouteMapProps = {
    points?: MapPoint[]
    bbox?: [number, number, number, number] | null
    markers?: LiveMarker[]
    height?: string
    className?: string
    /** Render the line as a 2-stop gradient (start → end) instead of solid. */
    gradient?: boolean
    /** Solid line color (hex). Overrides gradient when set. */
    lineColor?: string
    /** Draw the route as per-status colored sub-paths. Overrides the solid line. */
    segments?: ColoredSegment[]
    /** Small markers drawn above the route: stops and the replay position. */
    pois?: MapPoi[]
}

export default function RouteMap(props: RouteMapProps) {
    return MAP_PROVIDER === "google" ? (
        <GoogleRouteMap {...props} />
    ) : (
        <MapLibreRouteMap {...props} />
    )
}

function MapLibreRouteMap({
    points,
    bbox,
    markers,
    height = "100%",
    className,
    gradient = false,
    lineColor,
    segments,
    pois,
}: RouteMapProps) {
    const mapRef = useRef<MapRef | null>(null)

    const segmentFeatures = useMemo(() => {
        const valid = (segments ?? []).filter((s) => s.points.length >= 2)
        if (valid.length === 0) return null
        return {
            type: "FeatureCollection" as const,
            features: valid.map((s) => ({
                type: "Feature" as const,
                properties: { color: s.color },
                geometry: {
                    type: "LineString" as const,
                    coordinates: s.points,
                },
            })),
        }
    }, [segments])

    const polylineFeature = useMemo(() => {
        if (!points || points.length < 2) return null
        return {
            type: "Feature" as const,
            properties: {},
            geometry: {
                type: "LineString" as const,
                coordinates: points,
            },
        }
    }, [points])

    // Only re-fit when the *set* of things to frame changes (a new bbox, or a
    // different roster/selection of markers). Live tracking refreshes marker
    // coordinates on every tick — refitting on those would constantly yank the
    // user's pan/zoom, so coordinate-only updates intentionally don't re-fit.
    const fitSignature = useMemo(() => {
        if (bbox && bbox.length === 4) return `bbox:${bbox.join(",")}`
        if (markers && markers.length > 0)
            return `markers:${markers.map((m) => m.id).join(",")}`
        return null
    }, [bbox, markers])

    useEffect(() => {
        const map = mapRef.current
        if (!map || !fitSignature) return
        if (bbox && bbox.length === 4) {
            map.fitBounds(
                [
                    [bbox[0], bbox[1]],
                    [bbox[2], bbox[3]],
                ],
                { padding: 80, duration: 700, maxZoom: 15 },
            )
            return
        }
        if (markers && markers.length === 1) {
            map.flyTo({
                center: [markers[0].lng, markers[0].lat],
                zoom: 13,
                duration: 700,
            })
        } else if (markers && markers.length > 1) {
            const lngs = markers.map((m) => m.lng)
            const lats = markers.map((m) => m.lat)
            map.fitBounds(
                [
                    [Math.min(...lngs), Math.min(...lats)],
                    [Math.max(...lngs), Math.max(...lats)],
                ],
                { padding: 96, duration: 700, maxZoom: 12 },
            )
        }
        // fitSignature collapses bbox/markers into a stable key; refitting only
        // when it changes is the intended behavior.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fitSignature])

    const startPoint = points && points.length > 0 ? points[0] : null
    const endPoint =
        points && points.length > 1 ? points[points.length - 1] : null

    return (
        <div
            className={cn(
                "relative overflow-hidden bg-slate-100 dark:bg-slate-950",
                className,
            )}
            style={{ height }}
        >
            <Map
                ref={mapRef}
                initialViewState={{
                    latitude: DEFAULT_CENTER.lat,
                    longitude: DEFAULT_CENTER.lng,
                    zoom: 11,
                }}
                mapStyle={MAP_STYLE_URL}
                style={{ width: "100%", height: "100%" }}
                onLoad={(e) => {
                    const map = e.target
                    const layers = map.getStyle().layers ?? []
                    for (const layer of layers) {
                        if (layer.type !== "symbol") continue
                        const hasText = (layer.layout as any)?.["text-field"]
                        if (!hasText) continue
                        map.setLayoutProperty(
                            layer.id,
                            "text-field",
                            LOCALIZED_TEXT_FIELD,
                        )
                    }
                }}
            >
                <NavigationControl
                    position="bottom-right"
                    showCompass={false}
                />

                {segmentFeatures ? (
                    <Source
                        key="route-segments"
                        id="route-segments"
                        type="geojson"
                        data={segmentFeatures}
                    >
                        <Layer
                            id="route-seg-casing"
                            type="line"
                            paint={{
                                "line-color": "#0b1220",
                                "line-width": 8,
                                "line-opacity": 0.45,
                            }}
                            layout={{
                                "line-cap": "round",
                                "line-join": "round",
                            }}
                        />
                        <Layer
                            id="route-seg-stroke"
                            type="line"
                            paint={{
                                "line-color": ["get", "color"],
                                "line-width": 4,
                            }}
                            layout={{
                                "line-cap": "round",
                                "line-join": "round",
                            }}
                        />
                    </Source>
                ) : polylineFeature ? (
                    <Source
                        key="route-line"
                        id="route-line"
                        type="geojson"
                        data={polylineFeature}
                        lineMetrics={gradient && !lineColor}
                    >
                        <Layer
                            id="route-line-casing"
                            type="line"
                            paint={{
                                "line-color": "#0b1220",
                                "line-width": 8,
                                "line-opacity": 0.45,
                            }}
                            layout={{
                                "line-cap": "round",
                                "line-join": "round",
                            }}
                        />
                        <Layer
                            id="route-line-stroke"
                            type="line"
                            paint={
                                lineColor
                                    ? {
                                          "line-color": lineColor,
                                          "line-width": 4,
                                      }
                                    : gradient
                                    ? {
                                          "line-color": "#10b981",
                                          "line-width": 4,
                                          "line-gradient": [
                                              "interpolate",
                                              ["linear"],
                                              ["line-progress"],
                                              0,
                                              "#22d3ee",
                                              0.5,
                                              "#10b981",
                                              1,
                                              "#f43f5e",
                                          ],
                                      }
                                    : {
                                          "line-color": "#10b981",
                                          "line-width": 4,
                                      }
                            }
                            layout={{
                                "line-cap": "round",
                                "line-join": "round",
                            }}
                        />
                    </Source>
                ) : null}

                {startPoint && (
                    <Marker
                        latitude={startPoint[1]}
                        longitude={startPoint[0]}
                        anchor="center"
                    >
                        <EndpointDot variant="start" label="Boshlanish" />
                    </Marker>
                )}
                {endPoint && (
                    <Marker
                        latitude={endPoint[1]}
                        longitude={endPoint[0]}
                        anchor="center"
                    >
                        <EndpointDot variant="end" label="Tugash" />
                    </Marker>
                )}

                {markers?.map((m) => (
                    <Marker
                        key={m.id}
                        latitude={m.lat}
                        longitude={m.lng}
                        anchor="center"
                        onClick={(e) => {
                            e.originalEvent.stopPropagation()
                            m.onClick?.()
                        }}
                    >
                        <DriverMarker marker={m} />
                    </Marker>
                ))}

                {pois?.map((p) => (
                    <Marker key={p.id} latitude={p.lat} longitude={p.lng} anchor="center">
                        <PoiMarker poi={p} />
                    </Marker>
                ))}
            </Map>

            {/* edge vignette — subtle dark fade for a 'screen' feel */}
            <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(8,14,28,0.18)_100%)] mix-blend-multiply dark:[background:radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
        </div>
    )
}
