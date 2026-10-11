import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { MONITORING_ROUTE_NORMS_SUMMARY } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useTranslation } from "react-i18next"
import { RouteNormFilterParams } from "./filters"
import { formatDateTime } from "./format"
import { IssueCode, RouteNormSummary } from "./types"

type Props = {
    params: RouteNormFilterParams
    ready: boolean
}

const STALE_TIME = 60 * 1000

const ISSUE_ORDER: IssueCode[] = [
    "no_gps_device",
    "no_gps_points",
    "no_window",
    "time_from_status",
    "no_zone",
    "gps_gap",
    "overlap",
    "too_short",
    "same_point",
]

export default function SummaryLine({ params, ready }: Props) {
    const { t } = useTranslation()
    const { data, isLoading, isError } = useGet<RouteNormSummary>(
        MONITORING_ROUTE_NORMS_SUMMARY,
        {
            params,
            enabled: ready,
            options: {
                queryKey: [MONITORING_ROUTE_NORMS_SUMMARY, params],
                staleTime: STALE_TIME,
            },
        },
    )

    if (isError) {
        return (
            <p className="text-sm text-muted-foreground mb-3" role="alert">
                {t("route_norms.summary.error")}
            </p>
        )
    }

    if (isLoading || !data) {
        return <div className="h-5 mb-3" aria-hidden />
    }

    if (data.trips_total === 0 && data.pending_orders === 0) {
        return (
            <p className="text-sm text-muted-foreground mb-3">
                {t("route_norms.summary.no_data")}
            </p>
        )
    }

    const reasons = ISSUE_ORDER.map((code) => ({
        code,
        count: data.issues?.[code] ?? 0,
    })).filter((item) => item.count > 0)

    return (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mb-3">
            <span>
                {t("route_norms.summary.total", { count: data.trips_total })}
            </span>
            <span aria-hidden>·</span>
            <span>
                {t("route_norms.summary.in_norm", { count: data.in_norm })}
            </span>
            <span aria-hidden>·</span>
            {data.not_in_norm > 0 && reasons.length > 0 ?
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-auto p-0 text-sm font-normal text-muted-foreground underline decoration-dotted underline-offset-4 hover:bg-transparent"
                        >
                            {t("route_norms.summary.not_in_norm", {
                                count: data.not_in_norm,
                            })}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 space-y-1 text-sm">
                        <p className="font-medium">
                            {t("route_norms.summary.reasons")}
                        </p>
                        {reasons.map((item) => (
                            <div
                                key={item.code}
                                className="flex items-center justify-between gap-3"
                            >
                                <span>{t(`route_norms.issues.${item.code}`)}</span>
                                <span className="tabular-nums">{item.count}</span>
                            </div>
                        ))}
                    </PopoverContent>
                </Popover>
            :   <span>
                    {t("route_norms.summary.not_in_norm", {
                        count: data.not_in_norm,
                    })}
                </span>
            }
            {data.pending_orders > 0 && (
                <>
                    <span aria-hidden>·</span>
                    <span>
                        {t("route_norms.summary.pending", {
                            count: data.pending_orders,
                        })}
                    </span>
                </>
            )}
            {!!data.last_computed_at && (
                <>
                    <span aria-hidden>·</span>
                    <span>
                        {t("route_norms.summary.last_computed", {
                            date: formatDateTime(data.last_computed_at),
                        })}
                    </span>
                </>
            )}
        </div>
    )
}
