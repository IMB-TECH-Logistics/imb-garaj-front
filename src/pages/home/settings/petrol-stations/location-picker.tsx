import "maplibre-gl/dist/maplibre-gl.css"
import maplibregl from "maplibre-gl"
import { useCallback, useMemo, useState } from "react"
import Map, {
    GeolocateControl,
    Marker,
    NavigationControl,
    type MapMouseEvent,
} from "react-map-gl/maplibre"

export type LatLng = { lat: number; lng: number }

export type LocationInfo = { address: string; name: string }

type Props = {
    value?: LatLng | null
    onChange: (loc: LatLng, info: LocationInfo) => void
    height?: string
}

const DEFAULT_CENTER: LatLng = { lat: 41.31115, lng: 69.27969 }

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
            attribution: "© OpenStreetMap contributors",
        },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
}

const reverseGeocode = async (loc: LatLng): Promise<LocationInfo> => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${loc.lat}&lon=${loc.lng}&accept-language=uz`
        const res = await fetch(url, {
            headers: { Accept: "application/json" },
        })
        const data = await res.json()
        const address: string = data.display_name ?? ""
        const name: string =
            data.name ||
            data.address?.amenity ||
            data.address?.road ||
            address
        return { address, name }
    } catch {
        return { address: "", name: "" }
    }
}

export default function LocationPicker({
    value,
    onChange,
    height = "320px",
}: Props) {
    const initial = useMemo(() => value ?? DEFAULT_CENTER, [])
    const [marker, setMarker] = useState<LatLng | null>(value ?? null)

    const place = useCallback(
        async (loc: LatLng) => {
            setMarker(loc)
            const info = await reverseGeocode(loc)
            onChange(loc, info)
        },
        [onChange],
    )

    const handleClick = useCallback(
        (e: MapMouseEvent) => {
            place({ lat: e.lngLat.lat, lng: e.lngLat.lng })
        },
        [place],
    )

    return (
        <div className="overflow-hidden rounded-md border" style={{ height }}>
            <Map
                initialViewState={{
                    latitude: initial.lat,
                    longitude: initial.lng,
                    zoom: value ? 14 : 11,
                }}
                mapStyle={OSM_STYLE as any}
                onClick={handleClick}
                style={{ width: "100%", height: "100%" }}
            >
                <NavigationControl
                    position="top-right"
                    showCompass={false}
                />
                <GeolocateControl
                    position="top-right"
                    trackUserLocation={false}
                    onGeolocate={(e) =>
                        place({
                            lat: e.coords.latitude,
                            lng: e.coords.longitude,
                        })
                    }
                />
                {marker && (
                    <Marker
                        latitude={marker.lat}
                        longitude={marker.lng}
                        draggable
                        onDragEnd={(e) =>
                            place({ lat: e.lngLat.lat, lng: e.lngLat.lng })
                        }
                    />
                )}
            </Map>
        </div>
    )
}
