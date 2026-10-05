import { cn } from "@/lib/utils"
import {
    GoogleMap,
    OverlayView,
    OverlayViewF,
    PolylineF,
    useJsApiLoader,
} from "@react-google-maps/api"
import { type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { ClusterMarker, DriverMarker, EndpointDot, PoiMarker, SpeedTooltip } from "./map-markers"
import { type MarkerCluster, SPREAD_ZOOM, clusterMarkers, separatesAt } from "./marker-clusters"
import { type MapPoint, type RouteHover, type RouteMapProps, nearestPoint } from "./route-map"

const MAX_FIT_ZOOM = 14
const HIDDEN_WIDTH = 50
const REFIT_SETTLE_MS = 400
const API_KEY = import.meta.env.VITE_GOOGLE_MAP_API_KEY
const DEFAULT_CENTER = { lat: 41.31115, lng: 69.27969 }
const CONTAINER_STYLE = { width: "100%", height: "100%" }
type MapMode = "roadmap" | "dark" | "hybrid" | "terrain"

const MAP_MODES: { value: MapMode; label: string }[] = [
    { value: "roadmap", label: "Xarita" },
    { value: "dark", label: "Qora" },
    { value: "hybrid", label: "Sputnik" },
    { value: "terrain", label: "Relyef" },
]

const MAP_MODE_KEY = "monitoring-map-mode"

const DARK_STYLE: google.maps.MapTypeStyle[] = [
    { elementType: "geometry", stylers: [{ color: "#1d2a38" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1d2a38" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8a9bb0" }] },
    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#3d4f63" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#c3cede" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#1f2d3c" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c3c4f" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a2533" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9aa9bb" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3b4f66" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1a2533" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#c3cede" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f1924" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4b6078" }] },
]

function readMapMode(): MapMode {
    try {
        const saved = localStorage.getItem(MAP_MODE_KEY)
        return MAP_MODES.some((m) => m.value === saved) ? (saved as MapMode) : "roadmap"
    } catch {
        return "roadmap"
    }
}

const MAP_OPTIONS: google.maps.MapOptions = {
    clickableIcons: false,
    fullscreenControl: false,
    mapTypeControl: false,
    streetViewControl: false,
}
const ROUTE_COLOR = "#10b981"

const toLatLng = ([lng, lat]: MapPoint) => ({ lat, lng })
const centerOnPoint = (width: number, height: number) => ({
    x: -width / 2,
    y: -height / 2,
})
const aboveTheLine = (width: number, height: number) => ({
    x: -width / 2,
    y: -height - 10,
})

type PixelOffset = (width: number, height: number) => { x: number; y: number }

function Pin({
    lat,
    lng,
    pane = OverlayView.OVERLAY_MOUSE_TARGET,
    offset = centerOnPoint,
    children,
}: {
    lat: number
    lng: number
    pane?: keyof google.maps.MapPanes
    offset?: PixelOffset
    children: ReactNode
}) {
    const position = useMemo(() => ({ lat, lng }), [lat, lng])
    return (
        <OverlayViewF position={position} mapPaneName={pane} getPixelPositionOffset={offset}>
            {children}
        </OverlayViewF>
    )
}

function MovingPin({
    map,
    lat,
    lng,
    children,
}: {
    map: google.maps.Map | null
    lat: number
    lng: number
    children: ReactNode
}) {
    const container = useMemo(() => {
        const div = document.createElement("div")
        div.style.position = "absolute"
        div.style.zIndex = "10"
        return div
    }, [])
    const at = useRef({ lat, lng })
    at.current = { lat, lng }
    const overlay = useRef<google.maps.OverlayView | null>(null)

    useEffect(() => {
        if (!map) return
        const view = new google.maps.OverlayView()
        view.onAdd = () => view.getPanes()?.overlayMouseTarget.appendChild(container)
        view.draw = () => {
            const point = view.getProjection()?.fromLatLngToDivPixel(new google.maps.LatLng(at.current.lat, at.current.lng))
            if (!point) return
            container.style.left = `${point.x - container.offsetWidth / 2}px`
            container.style.top = `${point.y - container.offsetHeight / 2}px`
        }
        view.onRemove = () => container.remove()
        view.setMap(map)
        overlay.current = view
        return () => {
            view.setMap(null)
            overlay.current = null
        }
    }, [map, container])

    useLayoutEffect(() => {
        overlay.current?.draw()
    }, [lat, lng])

    return createPortal(children, container)
}

export default function GoogleRouteMap({
    points,
    bbox,
    markers,
    height = "100%",
    className,
    lineColor,
    segments,
    pois,
    onBoundsChange,
}: RouteMapProps) {
    const { t } = useTranslation()
    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: API_KEY,
        language: "uz",
        region: "UZ",
    })
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const [hover, setHover] = useState<RouteHover | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [refitTick, setRefitTick] = useState(0)
    const [zoom, setZoom] = useState(11)
    const [mapMode, setMapMode] = useState<MapMode>(readMapMode)
    const changeMapMode = (next: MapMode) => {
        setMapMode(next)
        try {
            localStorage.setItem(MAP_MODE_KEY, next)
        } catch {
            return
        }
    }

    const clustered = useMemo(() => clusterMarkers(markers ?? [], zoom), [markers, zoom])

    const zoomToCluster = (cluster: MarkerCluster) => {
        if (!map) return
        const bounds = new google.maps.LatLngBounds()
        cluster.members.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }))
        map.fitBounds(bounds, 96)
        google.maps.event.addListenerOnce(map, "idle", () => {
            if ((map.getZoom() ?? 0) > SPREAD_ZOOM) map.setZoom(SPREAD_ZOOM)
        })
    }

    useEffect(() => {
        const node = containerRef.current
        if (!node) return
        let hidden = false
        let timer: ReturnType<typeof setTimeout> | undefined
        const observer = new ResizeObserver(([entry]) => {
            if (entry.contentRect.width < HIDDEN_WIDTH) {
                hidden = true
                clearTimeout(timer)
                return
            }
            if (!hidden) return
            clearTimeout(timer)
            timer = setTimeout(() => {
                hidden = false
                setRefitTick((tick) => tick + 1)
            }, REFIT_SETTLE_MS)
        })
        observer.observe(node)
        return () => {
            clearTimeout(timer)
            observer.disconnect()
        }
    }, [])

    const validSegments = (segments ?? []).filter((s) => s.points.length >= 2)
    const startPoint = points && points.length > 0 ? points[0] : null
    const endPoint =
        points && points.length > 1 ? points[points.length - 1] : null

    const fitSignature = useMemo(() => {
        if (bbox && bbox.length === 4) return `bbox:${bbox.join(",")}`
        if (markers && markers.length > 0)
            return `markers:${markers.map((m) => m.id).join(",")}`
        return null
    }, [bbox, markers])

    useEffect(() => {
        if (!map || !fitSignature) return
        if (bbox && bbox.length === 4) {
            map.fitBounds(
                { west: bbox[0], south: bbox[1], east: bbox[2], north: bbox[3] },
                80,
            )
            google.maps.event.addListenerOnce(map, "idle", () => {
                if ((map.getZoom() ?? 0) > MAX_FIT_ZOOM) map.setZoom(MAX_FIT_ZOOM)
            })
            return
        }
        if (markers && markers.length === 1) {
            map.panTo({ lat: markers[0].lat, lng: markers[0].lng })
            map.setZoom(13)
        } else if (markers && markers.length > 1) {
            const bounds = new google.maps.LatLngBounds()
            markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }))
            map.fitBounds(bounds, 96)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, fitSignature, refitTick])

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative overflow-hidden bg-slate-100 dark:bg-slate-950",
                className,
            )}
            style={{ height }}
        >
            {isLoaded && (
                <div className="absolute bottom-7 left-2 z-[500] flex items-center gap-0.5 rounded-lg border bg-background/95 p-0.5 shadow-md backdrop-blur">
                    {MAP_MODES.map((m) => (
                        <button
                            key={m.value}
                            type="button"
                            onClick={() => changeMapMode(m.value)}
                            className={cn(
                                "h-7 rounded-md px-2.5 text-xs font-medium transition",
                                mapMode === m.value
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                            )}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            )}
            {loadError && (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                    Google xaritani yuklab bo'lmadi
                </div>
            )}
            {isLoaded && (
                <GoogleMap
                    mapContainerStyle={CONTAINER_STYLE}
                    center={DEFAULT_CENTER}
                    zoom={11}
                    options={mapMode === "dark" ? { ...MAP_OPTIONS, styles: DARK_STYLE } : { ...MAP_OPTIONS, styles: null }}
                    mapTypeId={mapMode === "dark" ? "roadmap" : mapMode}
                    onLoad={setMap}
                    onZoomChanged={() => {
                        const next = map?.getZoom()
                        if (next != null) setZoom(next)
                    }}
                    onUnmount={() => setMap(null)}
                    onIdle={() => {
                        const box = map?.getBounds()
                        if (!box || !onBoundsChange) return
                        const ne = box.getNorthEast()
                        const sw = box.getSouthWest()
                        onBoundsChange({ north: ne.lat(), east: ne.lng(), south: sw.lat(), west: sw.lng() })
                    }}
                >
                    {validSegments.length > 0
                        ? validSegments.map((s, i) => (
                              <PolylineF
                                  key={i}
                                  path={s.points.map(toLatLng)}
                                  options={{
                                      strokeColor: s.color,
                                      strokeOpacity: s.opacity ?? 1,
                                      strokeWeight: 4,
                                  }}
                              />
                          ))
                        : points &&
                          points.length >= 2 && (
                              <PolylineF
                                  path={points.map(toLatLng)}
                                  options={{
                                      strokeColor: lineColor ?? ROUTE_COLOR,
                                      strokeWeight: 4,
                                  }}
                              />
                          )}

                    {validSegments.map(
                        (s, i) =>
                            s.speeds && (
                                <PolylineF
                                    key={`hit-${i}`}
                                    path={s.points.map(toLatLng)}
                                    options={{
                                        strokeOpacity: 0,
                                        strokeWeight: 16,
                                        zIndex: 10,
                                    }}
                                    onMouseMove={(e) => {
                                        const at = e.latLng
                                        if (at) setHover(nearestPoint(s, at.lng(), at.lat()))
                                    }}
                                    onMouseOut={() => setHover(null)}
                                />
                            ),
                    )}

                    {hover && (
                        <Pin
                            lat={hover.lat}
                            lng={hover.lng}
                            pane={OverlayView.FLOAT_PANE}
                            offset={aboveTheLine}
                        >
                            <SpeedTooltip speed={hover.speed} time={hover.time} />
                        </Pin>
                    )}

                    {startPoint && (
                        <Pin
                            lat={startPoint[1]}
                            lng={startPoint[0]}
                        >
                            <EndpointDot variant="start" label={t("actions.start")} />
                        </Pin>
                    )}
                    {endPoint && (
                        <Pin
                            lat={endPoint[1]}
                            lng={endPoint[0]}
                        >
                            <EndpointDot variant="end" label={t("actions.finish")} />
                        </Pin>
                    )}

                    {clustered.clusters.map((c) => (
                        <Pin
                            key={`cluster-${c.id}`}
                            lat={c.lat}
                            lng={c.lng}
                        >
                            <ClusterMarker
                                cluster={c}
                                spread={separatesAt(c.members, SPREAD_ZOOM)}
                                onZoom={() => zoomToCluster(c)}
                            />
                        </Pin>
                    ))}

                    {clustered.singles.map((m) =>
                        m.id === "replay" ? (
                            <MovingPin key={m.id} map={map} lat={m.lat} lng={m.lng}>
                                <DriverMarker marker={m} />
                            </MovingPin>
                        ) : (
                            <Pin key={m.id} lat={m.lat} lng={m.lng}>
                                <DriverMarker marker={m} />
                            </Pin>
                        ),
                    )}

                    {pois?.map((p) => (
                        <Pin
                            key={p.id}
                            lat={p.lat}
                            lng={p.lng}
                            pane={OverlayView.FLOAT_PANE}
                        >
                            <PoiMarker poi={p} />
                        </Pin>
                    ))}
                </GoogleMap>
            )}
        </div>
    )
}
