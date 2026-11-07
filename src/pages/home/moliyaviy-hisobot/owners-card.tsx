import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useHasAction } from "@/constants/useUser"
import { usePost } from "@/hooks/usePost"
import { cn } from "@/lib/utils"
import { num, onApiError } from "@/pages/home/kontragent/api"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { format } from "date-fns"
import { ChevronDown, Send } from "lucide-react"
import { Fragment, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { MonthlyReport, reportUrl } from "./api"
import { Money } from "./index"

const usd = (v: string | number) =>
    `$${Math.round(num(v)).toLocaleString("ru-RU").replace(/ /g, " ")}`

export const OwnersCard = ({ report }: { report: MonthlyReport }) => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const canEdit = useHasAction("investor_control")
    const [open, setOpen] = useState<number | null>(null)
    const { mutate: post, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("fin_report.owners.posted_ok"))
            qc.invalidateQueries({
                predicate: (q) =>
                    String(q.queryKey[0]).startsWith("kontragent"),
            })
        },
        onError: onApiError(t("messages.error")),
    })
    if (!report.owners?.length) return null

    return (
        <Card className="min-w-0">
            <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col">
                        <h2 className="text-base font-semibold">
                            {t("fin_report.owners.title")}
                        </h2>
                        <span className="text-xs text-muted-foreground">
                            {report.posted_at ?
                                t("fin_report.owners.posted_at", {
                                    date: format(
                                        new Date(report.posted_at),
                                        "dd.MM.yyyy HH:mm",
                                    ),
                                })
                            :   t("fin_report.owners.not_posted")}
                        </span>
                    </div>
                    {canEdit && (
                        <Button
                            variant={report.posted_at ? "outline" : "default"}
                            loading={isPending}
                            onClick={() =>
                                post(reportUrl(report.id, "post"), {})
                            }
                        >
                            <Send className="w-4 h-4" />
                            {report.posted_at ?
                                t("fin_report.owners.repost")
                            :   t("fin_report.owners.post")}
                        </Button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-muted-foreground text-xs border-b">
                                <th className="text-left font-medium py-2 pr-2">
                                    {t("fin_report.owners.kontragent")}
                                </th>
                                <th className="text-right font-medium py-2 px-2">
                                    {t("fin_report.owners.rent")}
                                </th>
                                <th className="text-right font-medium py-2 px-2">
                                    {t("fin_report.owners.repair")}
                                </th>
                                <th className="text-right font-medium py-2 px-2">
                                    {t("fin_report.owners.dividend")}
                                </th>
                                <th className="text-right font-medium py-2 pl-2">
                                    {t("fin_report.owners.balance")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.owners.map((o) => (
                                <Fragment key={o.kontragent}>
                                    <tr
                                        className="border-b cursor-pointer hover:bg-muted/30"
                                        onClick={() =>
                                            setOpen(
                                                open === o.kontragent ?
                                                    null
                                                :   o.kontragent,
                                            )
                                        }
                                    >
                                        <td className="py-2 pr-2">
                                            <span className="flex items-center gap-1.5">
                                                <ChevronDown
                                                    className={cn(
                                                        "w-3.5 h-3.5 transition-transform",
                                                        open === o.kontragent &&
                                                            "rotate-180",
                                                    )}
                                                />
                                                <Link
                                                    to="/kontragentlar/$id"
                                                    params={{
                                                        id: String(
                                                            o.kontragent,
                                                        ),
                                                    }}
                                                    className="font-medium hover:underline"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    {o.name}
                                                </Link>
                                            </span>
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            <div className="flex flex-col items-end">
                                                <Money value={o.rent} />
                                                <span className="text-xs text-muted-foreground">
                                                    {usd(o.rent_usd)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            <Money value={-num(o.repair)} />
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            <div className="flex flex-col items-end">
                                                <Money value={o.dividend} />
                                                <span className="text-xs text-muted-foreground">
                                                    {num(o.share)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-2 pl-2 text-right">
                                            <Money value={o.balance} strong />
                                        </td>
                                    </tr>
                                    {open === o.kontragent &&
                                        o.vehicles.map((v) => (
                                            <tr
                                                key={`${v.vehicle}-${v.part}`}
                                                className="border-b bg-muted/10 text-xs"
                                            >
                                                <td className="py-1.5 pr-2 pl-6 text-muted-foreground">
                                                    {v.plate} ·{" "}
                                                    {t(
                                                        `fin_report.part.${v.part}`,
                                                    )}
                                                </td>
                                                <td className="py-1.5 px-2 text-right">
                                                    <Money value={v.rent} />{" "}
                                                    <span className="text-muted-foreground">
                                                        ({usd(v.rent_usd)})
                                                    </span>
                                                </td>
                                                <td className="py-1.5 px-2 text-right">
                                                    <Money
                                                        value={-num(v.repair)}
                                                    />
                                                </td>
                                                <td />
                                                <td />
                                            </tr>
                                        ))}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-muted-foreground">
                    {t("fin_report.owners.hint")}
                </p>
            </CardContent>
        </Card>
    )
}
