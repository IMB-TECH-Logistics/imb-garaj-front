import { Badge } from "@/components/ui/badge"
import { Route as RouteIcon, User2 } from "lucide-react"
import {
    DimensionEmpty,
    DimensionListSkeleton,
    DimensionRow,
} from "./dimension-row"
import type { VehicleTracking } from "./types"

const STATUS_LABEL: Record<number, string> = {
    1: "Band",
    2: "Bo'sh",
    3: "Ta'mirda",
}

type Props = {
    items: VehicleTracking[]
    loading?: boolean
    activeId?: number | null
    onSelect?: (vehicle: VehicleTracking) => void
}

export default function VehicleList({
    items,
    loading,
    activeId,
    onSelect,
}: Props) {
    if (loading && items.length === 0) return <DimensionListSkeleton />
    if (!loading && items.length === 0) {
        return (
            <DimensionEmpty
                title="GPS izi bor moshina yo'q"
                hint="Reys boshlanganidan keyin paydo bo'ladi"
            />
        )
    }

    return (
        <ul className="flex flex-col gap-1.5">
            {items.map((vehicle, i) => (
                <DimensionRow
                    key={vehicle.id}
                    index={i}
                    active={vehicle.id === activeId}
                    secondsSince={vehicle.seconds_since}
                    onClick={() => onSelect?.(vehicle)}
                    primary={vehicle.truck_number}
                    badge={
                        vehicle.status != null && (
                            <Badge
                                variant={
                                    vehicle.status === 1
                                        ? "default"
                                        : "secondary"
                                }
                                className="h-5 px-1.5 text-[10px] font-medium"
                            >
                                {STATUS_LABEL[vehicle.status] ?? "—"}
                            </Badge>
                        )
                    }
                    secondary={
                        <>
                            {vehicle.driver_name && (
                                <span className="inline-flex items-center gap-1 truncate">
                                    <User2 className="h-3 w-3 shrink-0" />
                                    <span className="truncate">
                                        {vehicle.driver_name}
                                    </span>
                                </span>
                            )}
                            {vehicle.trip != null && (
                                <span className="inline-flex items-center gap-1 font-mono">
                                    <RouteIcon className="h-3 w-3" />
                                    R-{vehicle.trip}
                                </span>
                            )}
                        </>
                    }
                />
            ))}
        </ul>
    )
}
