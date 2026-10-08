import { GoogleMap, CircleF, MarkerF, useJsApiLoader } from "@react-google-maps/api"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

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
const CONTAINER_STYLE = { width: "100%", height: "100%" }
const MAP_OPTIONS: google.maps.MapOptions = {
    clickableIcons: false,
    fullscreenControl: false,
    mapTypeControl: false,
    streetViewControl: false,
}
const CIRCLE_OPTIONS: google.maps.CircleOptions = {
    strokeColor: "#10b981",
    strokeOpacity: 0.9,
    strokeWeight: 2,
    fillColor: "#10b981",
    fillOpacity: 0.15,
    clickable: false,
}

const ZoneMap = ({ point, radius, onChange, defaultCenter }: Props) => {
    const { t } = useTranslation()
    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_API_KEY,
        language: "uz",
        region: "UZ",
    })
    const [map, setMap] = useState<google.maps.Map | null>(null)

    useEffect(() => {
        if (!map || !point) return
        map.panTo(point)
    }, [map, point?.lat, point?.lng])

    useEffect(() => {
        if (!map || point || !defaultCenter) return
        map.panTo(defaultCenter)
        map.setZoom(11)
    }, [map, defaultCenter?.lat, defaultCenter?.lng])

    const pick = (e: google.maps.MapMouseEvent | google.maps.IconMouseEvent) => {
        if (!e.latLng) return
        onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() })
    }

    if (loadError) {
        return (
            <div className="flex h-full items-center justify-center rounded-md border text-sm text-destructive">
                {t("messages.error")}
            </div>
        )
    }

    if (!isLoaded) {
        return <div className="h-full animate-pulse rounded-md bg-muted" />
    }

    return (
        <GoogleMap
            mapContainerStyle={CONTAINER_STYLE}
            center={point ?? defaultCenter ?? DEFAULT_CENTER}
            zoom={point ? 13 : 11}
            options={MAP_OPTIONS}
            onLoad={setMap}
            onUnmount={() => setMap(null)}
            onClick={pick}
        >
            {point && (
                <>
                    <MarkerF position={point} draggable onDragEnd={pick} />
                    <CircleF
                        center={point}
                        radius={radius > 0 ? radius : 0}
                        options={CIRCLE_OPTIONS}
                    />
                </>
            )}
        </GoogleMap>
    )
}

export default ZoneMap
