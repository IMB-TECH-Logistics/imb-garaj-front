import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MONITORING_GPS_LIVE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatDateTime } from "@/lib/format-date"
import RouteMap, { LiveMarker } from "@/pages/home/monitoring/route-map"
import { GpsLiveVehicle, isRussiaTruck } from "@/pages/home/monitoring/types"
import { Loader2, MapPinOff } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const REFRESH_MS = 15_000

const normalize = (s?: string | null) => (s ?? "").replace(/\s+/g, "").toUpperCase()

type Props = {
    vehicle: ManagerVehicles | null
    onClose: () => void
}

export default function VehicleLocationDialog({ vehicle, onClose }: Props) {
    const { t } = useTranslation()
    const open = vehicle != null

    const { data, isLoading, isError } = useGet<GpsLiveVehicle[]>(MONITORING_GPS_LIVE, {
        enabled: open,
        options: { refetchInterval: open ? REFRESH_MS : false, retry: 1 },
    })

    const item = useMemo(() => {
        if (!vehicle || !data) return null
        return (
            data.find((g) => g.vehicle === vehicle.id) ??
            data.find((g) => normalize(g.vehicle_number) === normalize(vehicle.truck_number)) ??
            null
        )
    }, [data, vehicle])

    const hasPosition = item?.lat != null && item?.lng != null

    const markers: LiveMarker[] = useMemo(
        () =>
            item && hasPosition ?
                [
                    {
                        id: `gps-${item.imei}`,
                        lat: item.lat as number,
                        lng: item.lng as number,
                        label: vehicle?.truck_number || item.vehicle_number || item.tracker_name || item.imei,
                        sub:
                            item.speed != null ?
                                `${Math.round(item.speed)} ${t("mon.units.kmh")}`
                            :   (item.driver_name ?? undefined),
                        stale: item.status !== "online",
                        icon: "truck",
                        russia: isRussiaTruck(item),
                        course: item.course,
                        selected: true,
                    },
                ]
            :   [],
        [item, hasPosition, vehicle, t],
    )

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-5xl w-[calc(100vw-2rem)] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-5 py-4 border-b space-y-1 text-left">
                    <DialogTitle className="flex flex-wrap items-center gap-2">
                        {vehicle?.truck_number || "-"}
                        {item && (
                            <Badge
                                variant="outline"
                                className={
                                    item.status === "online" ?
                                        "border-transparent bg-green-500/10 text-green-600"
                                    :   "border-transparent bg-muted text-muted-foreground"
                                }
                            >
                                {item.status === "online" ? t("location.online") : t("location.offline")}
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription className="flex flex-wrap gap-x-4 gap-y-1">
                        {vehicle?.driver_name && <span>{vehicle.driver_name}</span>}
                        {item?.speed != null && (
                            <span>
                                {t("location.speed")}:{" "}
                                <span className="text-foreground font-medium">
                                    {Math.round(item.speed)} {t("mon.units.kmh")}
                                </span>
                            </span>
                        )}
                        {(item?.fix_time || item?.last_update) && (
                            <span>
                                {t("location.updated")}:{" "}
                                <span className="text-foreground font-medium">
                                    {formatDateTime((item.fix_time || item.last_update) as string)}
                                </span>
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="relative h-[70vh] min-h-[360px]">
                    {hasPosition ?
                        <RouteMap markers={markers} height="100%" className="h-full" />
                    : isLoading ?
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            <Loader2 className="animate-spin" />
                        </div>
                    :   <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
                            <MapPinOff size={32} />
                            <span>{isError ? t("location.error") : t("location.no_gps")}</span>
                        </div>
                    }
                </div>
            </DialogContent>
        </Dialog>
    )
}
