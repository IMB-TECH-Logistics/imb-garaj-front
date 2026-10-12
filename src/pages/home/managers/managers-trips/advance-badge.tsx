import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/format-money"
import { useTranslation } from "react-i18next"

type Props = {
    pending?: number | string | null
    rejected?: { amount: number | string; reason: string | null } | null
    compact?: boolean
}

export default function AdvanceBadge({ pending, rejected, compact }: Props) {
    const { t } = useTranslation()
    if (pending)
        return (
            <Badge variant="orange" className="w-fit whitespace-nowrap">
                {compact ?
                    t("trips.advance.pending_compact", { amount: formatMoney(Number(pending)) })
                :   t("trips.advance.pending_full", { amount: formatMoney(Number(pending)) })}
            </Badge>
        )
    if (rejected)
        return (
            <div className="flex flex-col items-start gap-0.5">
                <Badge variant="destructive" className="w-fit whitespace-nowrap">
                    {t("trips.advance.rejected", { amount: formatMoney(Number(rejected.amount)) })}
                </Badge>
                {!compact && (
                    <span className="text-xs text-muted-foreground">
                        {rejected.reason ? `${t("trips.advance.reason", { reason: rejected.reason })} ` : ""}{t("trips.advance.fix_hint")}
                    </span>
                )}
            </div>
        )
    return null
}
