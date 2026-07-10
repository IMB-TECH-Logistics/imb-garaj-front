import { cn } from "@/lib/utils"
import { format, isToday, parseISO } from "date-fns"
import { Clock } from "lucide-react"
import {
    DimensionEmpty,
    DimensionListSkeleton,
    DimensionRow,
} from "./dimension-row"
import type { LiveDriver } from "./types"

type Props = {
    items: LiveDriver[]
    loading?: boolean
    activeId?: number | null
    onSelect?: (driver: LiveDriver) => void
}

export default function DriverList({
    items,
    loading,
    activeId,
    onSelect,
}: Props) {
    if (loading && items.length === 0) {
        return <DimensionListSkeleton />
    }
    if (!loading && items.length === 0) {
        return (
            <DimensionEmpty
                title="Hozir efirda avtomobil yo'q"
                hint="Yangi signal kelganda bu yerda paydo bo'ladi"
            />
        )
    }

    return (
        <ul className="flex flex-col gap-1.5">
            {items.map((driver, i) => (
                <DimensionRow
                    key={driver.user}
                    index={i}
                    active={driver.user === activeId}
                    secondsSince={driver.seconds_since}
                    onClick={() => onSelect?.(driver)}
                    primary={
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                                {i + 1}.
                            </span>

                            <span className="font-mono tracking-wide">
                                {driver.vehicle_number ??
                                    driver.driver_name ??
                                    "—"}
                            </span>
                        </span>
                    }
                    metaRight={
                        <span
                            className={cn(
                                "inline-flex items-center gap-1",
                                driver.last_seen &&
                                    !isToday(parseISO(driver.last_seen)) &&
                                    "text-destructive",
                            )}
                        >
                            <Clock className="h-3 w-3 shrink-0" />
                            {driver.last_seen ?
                                format(
                                    parseISO(driver.last_seen),
                                    "dd.MM.yyyy HH:mm",
                                )
                            :   "—"}
                        </span>
                    }
                />
            ))}
        </ul>
    )
}
