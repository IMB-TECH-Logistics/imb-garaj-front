import { useNavigate } from "@tanstack/react-router"
import { ArrowUpRight, Truck } from "lucide-react"
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
    const navigate = useNavigate()

    if (loading && items.length === 0) {
        return <DimensionListSkeleton />
    }
    if (!loading && items.length === 0) {
        return (
            <DimensionEmpty
                title="Hozir efirda haydovchi yo'q"
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
                    primary={driver.driver_name || `Driver #${driver.user}`}
                    secondary={
                        <>
                            {driver.vehicle_number && (
                                <span className="inline-flex items-center gap-1">
                                    <Truck className="h-3 w-3" />
                                    <span className="font-mono tracking-wide">
                                        {driver.vehicle_number}
                                    </span>
                                </span>
                            )}
                            {driver.trip != null && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        navigate({
                                            to: "/monitoring/trips/$id",
                                            params: {
                                                id: String(driver.trip),
                                            },
                                        })
                                    }}
                                    className="inline-flex items-center gap-0.5 rounded-sm text-primary transition hover:underline"
                                >
                                    <span className="font-mono">
                                        R-{driver.trip}
                                    </span>
                                    <ArrowUpRight className="h-3 w-3" />
                                </button>
                            )}
                        </>
                    }
                />
            ))}
        </ul>
    )
}
