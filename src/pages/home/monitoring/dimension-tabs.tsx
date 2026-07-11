import { cn } from "@/lib/utils"
import { Package, Route as RouteIcon, Truck, User2 } from "lucide-react"
import type { Dimension } from "./types"

type Tab = {
    value: Dimension
    label: string
    icon: typeof User2
}

const TABS: Tab[] = [
    { value: "driver", label: "Haydovchilar", icon: User2 },
    { value: "order", label: "Orderlar", icon: Package },
    { value: "trip", label: "Reyslar", icon: RouteIcon },
    { value: "vehicle", label: "Moshinalar", icon: Truck },
]

type Props = {
    value: Dimension
    onChange: (next: Dimension) => void
    counts?: Partial<Record<Dimension, number>>
}

export default function DimensionTabs({ value, onChange, counts }: Props) {
    return (
        <div
            role="tablist"
            aria-label="Monitoring kesimi"
            className="inline-flex h-9 items-center gap-0.5 rounded-md border bg-muted/30 p-0.5"
        >
            {TABS.map((tab) => {
                const active = value === tab.value
                const Icon = tab.icon
                const count = counts?.[tab.value]
                return (
                    <button
                        key={tab.value}
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(tab.value)}
                        className={cn(
                            "inline-flex h-8 items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium transition",
                            active
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                        {count != null && (
                            <span
                                className={cn(
                                    "rounded-sm px-1 font-mono text-[10px] tabular-nums",
                                    active
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground/80",
                                )}
                            >
                                {count}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
