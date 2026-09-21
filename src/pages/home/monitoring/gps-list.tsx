import { cn } from "@/lib/utils"
import { format, isToday, parseISO } from "date-fns"
import { Clock } from "lucide-react"
import {
    DimensionEmpty,
    DimensionListSkeleton,
    DimensionRow,
} from "./dimension-row"
import type { GpsLiveVehicle } from "./types"

type Props = {
    items: GpsLiveVehicle[]
    loading?: boolean
}

function secondsSince(value: string | null) {
    return value
        ? Math.max(0, Math.round((Date.now() - Date.parse(value)) / 1000))
        : null
}

export default function GpsList({ items, loading }: Props) {
    if (loading && items.length === 0) {
        return <DimensionListSkeleton />
    }
    if (!loading && items.length === 0) {
        return (
            <DimensionEmpty
                title="GPS qurilma yo'q"
                hint="Qurilmani «GPS biriktirish» orqali qo'shing"
            />
        )
    }

    return (
        <ul className="flex flex-col gap-1.5">
            {items.map((item, i) => (
                <DimensionRow
                    key={item.imei}
                    index={i}
                    secondsSince={secondsSince(item.last_update)}
                    primary={
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                                {i + 1}.
                            </span>
                            <span className="font-mono tracking-wide">
                                {item.vehicle_number || item.tracker_name || item.imei}
                            </span>
                        </span>
                    }
                    secondary={
                        item.speed != null
                            ? `${Math.round(item.speed)} km/h`
                            : undefined
                    }
                    metaRight={
                        <span
                            className={cn(
                                "inline-flex items-center gap-1",
                                item.last_update &&
                                    !isToday(parseISO(item.last_update)) &&
                                    "text-destructive",
                            )}
                        >
                            <Clock className="h-3 w-3 shrink-0" />
                            {item.last_update
                                ? format(parseISO(item.last_update), "dd.MM.yyyy HH:mm")
                                : "—"}
                        </span>
                    }
                />
            ))}
        </ul>
    )
}
