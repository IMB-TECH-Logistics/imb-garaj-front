import { googleMapsUrl } from "@/lib/coordinates"
import { MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"

type Props = {
    lat?: number | null
    lng?: number | null
    radius?: number | null
}

const CoordinatesCell = ({ lat, lng, radius }: Props) => {
    const { t } = useTranslation()
    if (lat == null || lng == null) {
        return <span className="text-muted-foreground">{t("coordinates.missing")}</span>
    }
    return (
        <a
            href={googleMapsUrl(lat, lng)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 whitespace-nowrap text-primary hover:underline tabular-nums"
            title={t("coordinates.open_map")}
        >
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {lat.toFixed(6)}, {lng.toFixed(6)}
            {radius ? <span className="text-muted-foreground">· {radius} m</span> : null}
        </a>
    )
}

export default CoordinatesCell
