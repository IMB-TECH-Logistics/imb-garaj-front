import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/format-date"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { ALERT_KIND_ICON, ALERT_RESOLVED_CLASS, ALERT_SEVERITY_CLASS } from "./alert-meta"
import type { AlertItem } from "./types"

type Props = {
    alert: AlertItem
    onOpenTrip?: (alert: AlertItem) => void
    onResolve?: (alert: AlertItem) => void
}

export function AlertRow({ alert, onOpenTrip, onResolve }: Props) {
    const { t } = useTranslation()
    const Icon = ALERT_KIND_ICON[alert.kind]
    const isOpen = alert.status === "open"
    const showActions = isOpen && alert.kind === "unassigned_drive" && alert.can_resolve

    return (
        <div className="flex items-start gap-3 px-4 py-3">
            <div
                className={cn(
                    "size-8 rounded-md grid place-items-center shrink-0",
                    isOpen ? ALERT_SEVERITY_CLASS[alert.severity] : ALERT_RESOLVED_CLASS,
                )}
            >
                <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium break-words">{alert.title}</p>
                    {isOpen && alert.severity === "overdue" && (
                        <Badge variant="destructive" className="shrink-0 text-[10px] py-0 px-1.5">
                            {t("alerts.overdue")}
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground break-words">{alert.message}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        {alert.vehicle.truck_number}
                    </Badge>
                    {alert.driver && <span>{alert.driver.name}</span>}
                    {alert.lot && <span>{alert.lot.name}</span>}
                    {isOpen && alert.remaining_km != null && (
                        <span>{t("alerts.remaining_km", { value: alert.remaining_km })}</span>
                    )}
                    {isOpen && alert.remaining_days != null && (
                        <span>{t("alerts.remaining_days", { value: alert.remaining_days })}</span>
                    )}
                    <span className="tabular-nums">{formatDateTime(alert.started_at ?? alert.created_at)}</span>
                </div>
                {!isOpen && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>
                            {[
                                alert.resolved_by_name,
                                formatDateTime(alert.resolved_at ?? undefined),
                                alert.resolve_reason ? t(`alerts.reason.${alert.resolve_reason}`) : null,
                            ]
                                .filter(Boolean)
                                .join(" · ")}
                        </p>
                        {alert.comment && <p className="italic break-words">{alert.comment}</p>}
                    </div>
                )}
                {showActions && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        <Button type="button" size="sm" className="h-7 px-2 text-xs" onClick={() => onOpenTrip?.(alert)}>
                            {t("alerts.open_trip")}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => onResolve?.(alert)}
                        >
                            {t("alerts.resolve_with_comment")}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
