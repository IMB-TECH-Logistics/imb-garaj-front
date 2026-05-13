import { cn } from "@/lib/utils"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useEffect, useMemo, useRef } from "react"
import Map, {
    Layer,
    type MapRef,
    Marker,
    NavigationControl,
    Source,
} from "react-map-gl/maplibre"

const OSM_STYLE: maplibregl.StyleSpecification = {
    version: 8,
    sources: {
        osm: {
            type: "raster",
            tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap",
        },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
}

const DEFAULT_CENTER = { lat: 41.31115, lng: 69.27969 }

export type MapPoint = [number, number] // [lng, lat]

export type LiveMarker = {
    id: string | number
    lat: number
    lng: number
    label: string
    sub?: string
    stale?: boolean
    selected?: boolean
    onClick?: () => void
}

type Props = {
    points?: MapPoint[]
    bbox?: [number, number, number, number] | null
    markers?: LiveMarker[]
    height?: string
    className?: string
    /** Render the line as a 2-stop gradient (start → end) instead of solid. */
    gradient?: boolean
}

export default function RouteMap({
    points,
    bbox,
    markers,
    height = "100%",
    className,
    gradient = false,
}: Props) {
    const mapRef = useRef<MapRef | null>(null)

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

    useEffect(() => {
        const map = mapRef.current
        if (!map) return
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
        if (markers && markers.length > 0) {
            if (markers.length === 1) {
                map.flyTo({
                    center: [markers[0].lng, markers[0].lat],
                    zoom: 13,
                    duration: 700,
                })
            } else {
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
        }
    }, [bbox, markers, points])

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
                ref={(r) => {
                    mapRef.current = r
                }}
                initialViewState={{
                    latitude: DEFAULT_CENTER.lat,
                    longitude: DEFAULT_CENTER.lng,
                    zoom: 11,
                }}
                mapStyle={OSM_STYLE as never}
                style={{ width: "100%", height: "100%" }}
            >
                <NavigationControl
                    position="bottom-right"
                    showCompass={false}
                />

                {polylineFeature && (
                    <Source
                        id="route-line"
                        type="geojson"
                        data={polylineFeature}
                        lineMetrics={gradient}
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
                                gradient
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
                )}

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
            </Map>

            {/* edge vignette — subtle dark fade for a 'screen' feel */}
            <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(8,14,28,0.18)_100%)] mix-blend-multiply dark:[background:radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
        </div>
    )
}

function EndpointDot({
    variant,
    label,
}: {
    variant: "start" | "end"
    label: string
}) {
    const color =
        variant === "start"
            ? "bg-emerald-500"
            : "bg-rose-500"
    const ring =
        variant === "start"
            ? "ring-emerald-500/30"
            : "ring-rose-500/30"
    return (
        <div className="group relative flex items-center justify-center">
            <div className={cn("h-3 w-3 rounded-full ring-4", color, ring)} />
            <div
                className={cn(
                    "pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100",
                    variant === "start" ? "bg-emerald-600" : "bg-rose-600",
                )}
            >
                {label}
            </div>
        </div>
    )
}

function DriverMarker({ marker }: { marker: LiveMarker }) {
    const fresh = !marker.stale
    return (
        <button
            type="button"
            onClick={marker.onClick}
            className="group relative flex flex-col items-center transition will-change-transform hover:-translate-y-0.5 hover:scale-[1.04]"
        >
            {/* pulse */}
            {fresh && (
                <>
                    <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[140%] h-10 w-10 rounded-full bg-emerald-500/30 animate-ping" />
                    <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[140%] h-7 w-7 rounded-full bg-emerald-500/40 animate-pulse" />
                </>
            )}

            {/* pin head */}
            <div
                className={cn(
                    "relative z-10 flex h-9 w-9 -mt-1 items-center justify-center rounded-full border-2 shadow-lg shadow-slate-900/30 backdrop-blur",
                    fresh
                        ? "border-emerald-500 bg-white/95 dark:bg-slate-900/95"
                        : "border-slate-400/60 bg-slate-200/85 dark:border-slate-600 dark:bg-slate-800/85",
                    marker.selected && "ring-4 ring-primary/40",
                )}
            >
                <span
                    className={cn(
                        "h-2 w-2 rounded-full",
                        fresh ? "bg-emerald-500" : "bg-slate-500",
                    )}
                />
            </div>

            {/* pin tail */}
            <span
                className={cn(
                    "z-0 -mt-0.5 h-2 w-0.5",
                    fresh ? "bg-emerald-500" : "bg-slate-400",
                )}
            />

            {/* label */}
            <div
                className={cn(
                    "mt-0.5 max-w-[180px] truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold shadow-md backdrop-blur-md transition",
                    fresh
                        ? "bg-white/95 text-slate-900 dark:bg-slate-900/95 dark:text-white"
                        : "bg-slate-200/85 text-slate-700 dark:bg-slate-800/85 dark:text-slate-300",
                )}
            >
                {marker.label}
            </div>
            {marker.sub && (
                <div className="mt-px max-w-[180px] truncate rounded-sm bg-white/85 px-1.5 py-px font-mono text-[10px] font-medium text-slate-600 shadow-sm dark:bg-slate-900/85 dark:text-slate-400">
                    {marker.sub}
                </div>
            )}
        </button>
    )
}
