import { Badge } from "@/components/ui/badge"
import { MapPinOff } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function NoLocationBadge({ count }: { count?: number | null }) {
    const { t } = useTranslation()
    if (!count) return <span className="text-muted-foreground">-</span>
    return (
        <Badge
            variant="outline"
            className="gap-1 whitespace-nowrap border-transparent bg-red-500/10 text-red-600"
            title={t("table.no_location_hint")}
        >
            <MapPinOff size={12} />
            {count}
        </Badge>
    )
}
