import { Button } from "@/components/ui/button"
import { ALERTS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { AlertRow } from "./alert-row"
import type { AlertItem, AlertListResponse } from "./types"

const PAGE_STEP = 20

type Props = {
    status: "open" | "resolved"
    onOpenTrip: (alert: AlertItem) => void
    onResolve: (alert: AlertItem) => void
}

export function AlertsList({ status, onOpenTrip, onResolve }: Props) {
    const { t } = useTranslation()
    const [pageSize, setPageSize] = useState(PAGE_STEP)
    const { data, isLoading, isError } = useGet<AlertListResponse>(ALERTS, {
        params: { status, page_size: pageSize },
        options: { refetchInterval: 60_000, staleTime: 30_000 },
    })
    const items = data?.results ?? []

    if (isLoading) {
        return <p className="text-sm text-muted-foreground text-center py-6">{t("messages.loading")}</p>
    }
    if (isError) {
        return <p className="text-sm text-destructive text-center py-6">{t("messages.error")}</p>
    }
    if (items.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-6">
                {t(status === "open" ? "alerts.empty_open" : "alerts.empty_resolved")}
            </p>
        )
    }
    return (
        <div className="divide-y divide-border">
            {items.map((alert) => (
                <AlertRow key={alert.id} alert={alert} onOpenTrip={onOpenTrip} onResolve={onResolve} />
            ))}
            {!!data?.next && (
                <div className="p-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-primary"
                        onClick={() => setPageSize((size) => size + PAGE_STEP)}
                    >
                        {t("alerts.show_more")}
                    </Button>
                </div>
            )}
        </div>
    )
}
