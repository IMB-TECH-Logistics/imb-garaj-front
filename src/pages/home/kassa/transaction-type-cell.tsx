import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import { Row } from "@tanstack/react-table"
import type { Transaction } from "./transaction-cols"

const TX_STATUS_LABEL_KEY: Record<number, string> = {
    10: "kassa.status_pending",
    20: "kassa.status_approved",
    [-10]: "kassa.status_rejected",
    [-20]: "kassa.status_rollback",
}

export const TransactionTypeCell = ({ row }: { row: Row<Transaction> }) => {
    const { t } = useTranslation()
    return (
        <div className="flex flex-col gap-1">
            <Badge
                variant={
                    row.original.type === -1 ?
                        "destructive"
                    :   "default"
                }
            >
                {row.original.type === -1 ? t("form.expense") : t("form.income")}
            </Badge>
            {row.original.awaiting_order_completion && (
                <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground"
                    title={t("kassa.awaiting_order_hint")}
                >
                    {t("kassa.awaiting_order")}
                </Badge>
            )}
            {row.original.status !== 20 && !row.original.awaiting_order_completion && (
                <Badge variant="orange">
                    {t(TX_STATUS_LABEL_KEY[row.original.status] ?? "kassa.status_pending")}
                </Badge>
            )}
            {row.original.status === 20 && row.original.is_unconfirmed && (
                <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-600 border-transparent"
                >
                    {t("fin.kassa.unconfirmed")}
                </Badge>
            )}
        </div>
    )
}
