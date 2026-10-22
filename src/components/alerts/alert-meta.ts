import { CircleDot, Droplets, RouteOff, Timer, type LucideIcon } from "lucide-react"
import type { AlertKind, AlertSeverity } from "./types"

export const ALERT_KIND_ICON: Record<AlertKind, LucideIcon> = {
    unassigned_drive: RouteOff,
    long_drive: Timer,
    oil_change: Droplets,
    tire_change: CircleDot,
}

export const ALERT_SEVERITY_CLASS: Record<AlertSeverity, string> = {
    info: "bg-sky-500/10 text-sky-600",
    warning: "bg-amber-500/10 text-amber-600",
    overdue: "bg-red-500/10 text-red-600",
}

export const ALERT_RESOLVED_CLASS = "bg-secondary text-muted-foreground"
