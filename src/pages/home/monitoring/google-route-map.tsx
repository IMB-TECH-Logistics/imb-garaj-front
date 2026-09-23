import { cn } from "@/lib/utils"
import {
    GoogleMap,
    OverlayView,
    OverlayViewF,
    PolylineF,
    useJsApiLoader,
} from "@react-google-maps/api"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { DriverMarker, EndpointDot, PoiMarker } from "./map-markers"
import type { MapPoint, RouteMapProps } from "./route-map"

const API_KEY = import.meta.env.VITE_GOOGLE_MAP_API_KEY
const DEFAULT_CENTER = { lat: 41.31115, lng: 69.27969 }
const CONTAINER_STYLE = { width: "100%", height: "100%" }
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

export default function GoogleRouteMap({
    points,
    bbox,
    markers,
    height = "100%",
    className,
    lineColor,
    segments,
    pois,
}: RouteMapProps) {
    const { t } = useTranslation()
    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: API_KEY,
        language: "uz",
        region: "UZ",
    })
    const [map, setMap] = useState<google.maps.Map | null>(null)

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
    }, [map, fitSignature])

    return (
        <div
            className={cn(
                "relative overflow-hidden bg-slate-100 dark:bg-slate-950",
                className,
            )}
            style={{ height }}
        >
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
                    options={MAP_OPTIONS}
                    onLoad={setMap}
                    onUnmount={() => setMap(null)}
                >
                    {validSegments.length > 0
                        ? validSegments.map((s, i) => (
                              <PolylineF
                                  key={i}
                                  path={s.points.map(toLatLng)}
                                  options={{
                                      strokeColor: s.color,
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

                    {startPoint && (
                        <OverlayViewF
                            position={toLatLng(startPoint)}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                            getPixelPositionOffset={centerOnPoint}
                        >
                            <EndpointDot variant="start" label={t("actions.start")} />
                        </OverlayViewF>
                    )}
                    {endPoint && (
                        <OverlayViewF
                            position={toLatLng(endPoint)}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                            getPixelPositionOffset={centerOnPoint}
                        >
                            <EndpointDot variant="end" label={t("actions.finish")} />
                        </OverlayViewF>
                    )}

                    {markers?.map((m) => (
                        <OverlayViewF
                            key={m.id}
                            position={{ lat: m.lat, lng: m.lng }}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                            getPixelPositionOffset={centerOnPoint}
                        >
                            <DriverMarker marker={m} />
                        </OverlayViewF>
                    ))}

                    {pois?.map((p) => (
                        <OverlayViewF
                            key={p.id}
                            position={{ lat: p.lat, lng: p.lng }}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                            getPixelPositionOffset={centerOnPoint}
                        >
                            <PoiMarker poi={p} />
                        </OverlayViewF>
                    ))}
                </GoogleMap>
            )}
        </div>
    )
}
