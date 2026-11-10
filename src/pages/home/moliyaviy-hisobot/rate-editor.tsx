import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useHasAction } from "@/constants/useUser"
import { usePatch } from "@/hooks/usePatch"
import { amountText, num, onApiError } from "@/pages/home/kontragent/api"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { MonthlyReport, reportUrl } from "./api"

export const RateEditor = ({ report }: { report: MonthlyReport }) => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const canEdit = useHasAction("fin_report_control") && report.status === "draft"
    const [editing, setEditing] = useState(false)
    const [value, setValue] = useState(
        report.usd_rate ? String(num(report.usd_rate)) : "",
    )
    const { mutate, isPending } = usePatch({
        onSuccess: () => {
            toast.success(t("fin_report.recalculated"))
            setEditing(false)
            qc.invalidateQueries({
                predicate: (q) =>
                    String(q.queryKey[0]).startsWith("kontragent"),
            })
        },
        onError: onApiError(t("messages.error")),
    })
    const missing = !report.usd_rate
    return (
        <div
            className={
                missing ?
                    "rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm flex flex-wrap items-center gap-2"
                :   "text-sm text-muted-foreground flex flex-wrap items-center gap-2"
            }
        >
            {missing ?
                <span className="text-destructive">
                    {t("fin_report.rate_missing")}
                </span>
            :   <span>
                    {t("fin_report.rate", {
                        rate: amountText(report.usd_rate ?? 0),
                    })}
                    {report.rate_date ?
                        ` (${t("fin_report.rate_source")}, ${format(new Date(report.rate_date), "dd.MM.yyyy")})`
                    :   ` (${t("fin_report.rate_manual")})`}
                </span>
            }
            {canEdit &&
                (editing || missing ?
                    <span className="flex items-center gap-2">
                        <Input
                            className="w-28 h-8 text-right"
                            type="number"
                            min={1}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                        <Button
                            size="sm"
                            disabled={!num(value)}
                            loading={isPending}
                            onClick={() =>
                                mutate(reportUrl(report.id), {
                                    usd_rate: num(value),
                                })
                            }
                        >
                            {t("actions.save")}
                        </Button>
                    </span>
                :   <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={t("actions.edit")}
                        onClick={() => setEditing(true)}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>)}
        </div>
    )
}
