import {
    DimensionEmpty,
    DimensionListSkeleton,
    DimensionRow,
} from "./dimension-row"
import { mockDriverIdentity } from "./status/data"
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
            {items.map((driver, i) => {
                const identity = mockDriverIdentity(driver.user)
                return (
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
                                {identity.plate}
                            </span>
                        </span>
                    }
                />
                )
            })}
        </ul>
    )
}
