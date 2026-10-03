import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/format-money"

type Props = {
    pending?: number | string | null
    rejected?: { amount: number | string; reason: string | null } | null
    compact?: boolean
}

export default function AdvanceBadge({ pending, rejected, compact }: Props) {
    if (pending)
        return (
            <Badge variant="orange" className="w-fit whitespace-nowrap">
                {compact ?
                    <>Avans kutilmoqda:{" "}{formatMoney(Number(pending))}</>
                :   <>Avans so'rovi:{" "}{formatMoney(Number(pending))}{" "}so'm · kassir tasdig'i kutilmoqda</>}
            </Badge>
        )
    if (rejected)
        return (
            <div className="flex flex-col items-start gap-0.5">
                <Badge variant="destructive" className="w-fit whitespace-nowrap">
                    Avans rad etildi:{" "}{formatMoney(Number(rejected.amount))}{" "}so'm
                </Badge>
                {!compact && (
                    <span className="text-xs text-muted-foreground">
                        {rejected.reason ? `Sabab: ${rejected.reason}. ` : ""}Kassa → So'rovlar bo'limidan tuzatib qayta yuboring.
                    </span>
                )}
            </div>
        )
    return null
}
