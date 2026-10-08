import { GoogleMap, CircleF, MarkerF, useJsApiLoader } from "@react-google-maps/api"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export type ZonePoint = { lat: number; lng: number }

type Props = {
    point: ZonePoint | null
    radius: number
    onChange: (point: ZonePoint) => void
}

const DEFAULT_CENTER = { lat: 41.31115, lng: 69.27969 }
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

const ZoneMap = ({ point, radius, onChange }: Props) => {
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
            center={point ?? DEFAULT_CENTER}
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
