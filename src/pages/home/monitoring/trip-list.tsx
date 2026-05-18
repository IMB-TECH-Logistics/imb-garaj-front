import { CalendarDays, Truck, User2 } from "lucide-react"
import {
    DimensionEmpty,
    DimensionListSkeleton,
    DimensionRow,
} from "./dimension-row"
import type { TripTracking } from "./types"

type Props = {
    items: TripTracking[]
    loading?: boolean
    activeId?: number | null
    onSelect?: (trip: TripTracking) => void
}

export default function TripList({
    items,
    loading,
    activeId,
    onSelect,
}: Props) {
    if (loading && items.length === 0) return <DimensionListSkeleton />
    if (!loading && items.length === 0) {
        return (
            <DimensionEmpty
                title="Hech qanday reys GPS yozmagan"
                hint="Boshqa filtr yoki sana oralig'ini sinab ko'ring"
            />
        )
    }

    return (
        <ul className="flex flex-col gap-1.5">
            {items.map((trip, i) => (
                <DimensionRow
                    key={trip.id}
                    index={i}
                    active={trip.id === activeId}
                    secondsSince={trip.seconds_since}
                    onClick={() => onSelect?.(trip)}
                    primary={`Reys #${trip.id}`}
                    secondary={
                        <>
                            {trip.driver_name && (
                                <span className="inline-flex items-center gap-1 truncate">
                                    <User2 className="h-3 w-3 shrink-0" />
                                    <span className="truncate">
                                        {trip.driver_name}
                                    </span>
                                </span>
                            )}
                            {trip.vehicle_number && (
                                <span className="inline-flex items-center gap-1">
                                    <Truck className="h-3 w-3" />
                                    <span className="font-mono tracking-wide">
                                        {trip.vehicle_number}
                                    </span>
                                </span>
                            )}
                            {trip.start && (
                                <span className="inline-flex items-center gap-1 font-mono">
                                    <CalendarDays className="h-3 w-3" />
                                    {trip.start}
                                    {trip.end ? ` → ${trip.end}` : ""}
                                </span>
                            )}
                        </>
                    }
                />
            ))}
        </ul>
    )
}
