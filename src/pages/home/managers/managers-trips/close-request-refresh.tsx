import { Button } from "@/components/ui/button"
import { useHasAction, useUser } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import i18n from "@/i18n/i18n"
import { toast } from "sonner"

const REQUESTS = "checkout/kassa-v2/requests"
const PENDING = 10
const REJECTED = -10

type CloseRequest = { id: number; kind: "qaytarish" | "berish"; status: number; amount: string }

const errorText = (e: any) => {
    const d = e?.response?.data
    if (!d) return i18n.t("trips.row.error")
    if (d.detail) return String(d.detail)
    const first = Object.values(d)[0]
    return Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : i18n.t("trips.row.error")
}

const signed = (kind: string, amount: number) => (kind === "berish" ? -amount : amount)

export default function CloseRequestRefresh({ tripId }: { tripId?: number }) {
    const { t } = useTranslation()
    const { data: user } = useUser()
    const isV2 = user?.kassa_mode === "driver_cash" && user?.kassa_version === 2
    const canEdit = useHasAction("manager_cashflow_control" as never)
    const qc = useQueryClient()
    const { data } = useGet<{ results: CloseRequest[] }>(REQUESTS, {
        params: { trip: tripId, kind: "qaytarish,berish", status: `${PENDING},${REJECTED}` },
        enabled: isV2 && !!tripId,
    })
    const request = data?.results?.[0]
    const { data: preview } = useGet<{ due: number | string; salary_default: number | string }>(`checkout/kassa-v2/trips/${tripId}/close-preview`, {
        enabled: !!request,
        options: { staleTime: 0 },
    })
    const { mutate, isPending } = usePost()
    if (!request) return null

    const sent = signed(request.kind, Number(request.amount))
    const now = preview ? Number(preview.due) - Number(preview.salary_default) : null
    const changed = now != null && Math.round(now) !== Math.round(sent)
    const side = (v: number) => (v >= 0 ? t("trips.kclose.cashier_takes") : t("trips.kclose.cashier_gives"))

    const refresh = () =>
        mutate(`${REQUESTS}/${request.id}/resend`, {}, {
            onSuccess: () => {
                toast.success(t("trips.kclose.request_refreshed"))
                qc.invalidateQueries({
                    predicate: (q) => {
                        const k = String(q.queryKey[0])
                        return k.startsWith("checkout/kassa-v2") || k.includes("cashflow") || k.includes("trips")
                    },
                })
            },
            onError: (e: unknown) => toast.error(errorText(e)),
        })

    return (
        <div className={cn("shrink-0 rounded-lg border px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm", changed ? "border-orange-500/40 bg-orange-500/5" : "bg-muted/20")}>
            <div className="flex flex-col gap-0.5">
                <span className="font-medium">
                    {t(request.status === REJECTED ? "trips.kclose.request_rejected" : "trips.kclose.request_pending")}: {side(sent)} {formatMoney(Math.abs(sent))}
                </span>
                {now != null && (
                    <span className={cn("text-xs", changed ? "text-orange-600" : "text-muted-foreground")}>
                        {changed ? t("trips.kclose.request_changed_now", { side: side(now), amount: formatMoney(Math.abs(now)) }) : t("trips.kclose.request_up_to_date")}
                    </span>
                )}
            </div>
            {canEdit && (
                <Button size="sm" variant={changed ? "default" : "outline"} className="h-8 gap-1" loading={isPending} onClick={refresh}>
                    <RefreshCw size={14} />
                    {t("trips.kclose.refresh_request")}
                </Button>
            )}
        </div>
    )
}
