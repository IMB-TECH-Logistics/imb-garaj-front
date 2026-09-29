import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { MANAGERS_ORDERS } from "@/constants/api-endpoints"
import { usePatch } from "@/hooks/usePatch"
import { formatMoney } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

type Props = {
    order: TripOrdersRow
}

export const hasPriceDiff = (order?: {
    manual_income?: boolean
    price_diff?: string | number
    price_diff_by_client?: boolean
}) =>
    !!order?.manual_income &&
    (Number(order.price_diff ?? 0) !== 0 || !!order.price_diff_by_client)

export default function PriceDiff({ order }: Props) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [diff, setDiff] = useState(Number(order.price_diff ?? 0))
    const [byClient, setByClient] = useState(!!order.price_diff_by_client)
    const { mutate, isPending } = usePatch<
        { price_diff_by_client: boolean },
        { price_diff?: string | number; price_diff_by_client?: boolean }
    >()

    if (!hasPriceDiff(order)) return null

    const shown = byClient ? 0 : diff

    const onToggle = (value: boolean) => {
        mutate(
            `${MANAGERS_ORDERS}/${order.id}`,
            { price_diff_by_client: value },
            {
                onSuccess: (res) => {
                    setByClient(!!res?.price_diff_by_client)
                    if (!res?.price_diff_by_client) {
                        setDiff(Number(res?.price_diff ?? 0))
                    }
                    queryClient.invalidateQueries({ queryKey: [MANAGERS_ORDERS] })
                },
            },
        )
    }

    return (
        <div className="rounded-lg border bg-card/50 p-3 flex items-center justify-between gap-3">
            <div className="text-sm">
                <span className="text-muted-foreground">{t("form.price_diff")}: </span>
                <span
                    className={`font-semibold tabular-nums ${
                        shown < 0 ? "text-red-500" : shown > 0 ? "text-green-600" : ""
                    }`}
                >
                    {formatMoney(shown, "", true)}
                </span>
                {shown !== 0 && (
                    <span className="text-muted-foreground">
                        {" "}
                        ({t(shown < 0 ? "form.price_diff_less" : "form.price_diff_more")})
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Label htmlFor="price-diff-by-client" className="text-sm cursor-pointer">
                    {t("form.price_diff_by_client")}
                </Label>
                <Switch
                    id="price-diff-by-client"
                    checked={byClient}
                    disabled={isPending}
                    onCheckedChange={onToggle}
                />
            </div>
        </div>
    )
}
