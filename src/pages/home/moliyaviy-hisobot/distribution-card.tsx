import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useHasAction } from "@/constants/useUser"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { cn } from "@/lib/utils"
import { num, onApiError } from "@/pages/home/kontragent/api"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { format } from "date-fns"
import { CheckCircle2, Undo2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { MonthlyReport, reportUrl } from "./api"
import { Money } from "./index"

const PCT_RE = /^(100(\.0{0,2})?|\d{0,2}(\.\d{0,2})?)$/

export const DistributionCard = ({ report }: { report: MonthlyReport }) => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const canEdit = useHasAction("investor_control")
    const draft = report.status === "draft"
    const editable = canEdit && draft
    const initial = useMemo(
        () => ({
            firm: String(num(report.firm_share)),
            shares: Object.fromEntries(
                report.shares.map((s) => [s.kontragent, String(num(s.pct))]),
            ) as Record<number, string>,
        }),
        [report.firm_share, report.shares],
    )
    const [firm, setFirm] = useState(initial.firm)
    const [shares, setShares] = useState(initial.shares)
    useEffect(() => {
        setFirm(initial.firm)
        setShares(initial.shares)
    }, [initial])
    const total =
        num(firm) + Object.values(shares).reduce((a, v) => a + num(v), 0)
    const dirty =
        firm !== initial.firm ||
        report.shares.some(
            (s) => shares[s.kontragent] !== initial.shares[s.kontragent],
        )

    const refresh = () =>
        qc.invalidateQueries({
            predicate: (q) => String(q.queryKey[0]).startsWith("kontragent"),
        })
    const onError = onApiError(t("messages.error"))
    const { mutate: save, isPending: saving } = usePatch({
        onSuccess: () => (toast.success(t("messages.success_edit")), refresh()),
        onError,
    })
    const { mutate: approve, isPending: approving } = usePost({
        onSuccess: () => (
            toast.success(t("fin_report.dist.approved_ok")), refresh()
        ),
        onError,
    })
    const { mutate: unapprove, isPending: unapproving } = usePost({
        onSuccess: () => (
            toast.success(t("fin_report.dist.unapproved_ok")), refresh()
        ),
        onError,
    })

    const owner = (id: number) => report.owners.find((o) => o.kontragent === id)
    const net = num(report.net)
    const base = net > 0 ? net : 0
    const pctInput = (value: string, onChange: (v: string) => void) =>
        editable ?
            <div className="flex justify-end">
                <Input
                    className="h-8 w-20 text-right"
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => {
                        const v = e.target.value.replace(",", ".")
                        if (PCT_RE.test(v)) onChange(v)
                    }}
                />
            </div>
        :   <span className="tabular-nums">{num(value)}%</span>

    return (
        <Card className="min-w-0">
            <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col">
                        <h2 className="text-base font-semibold">
                            {t("fin_report.dist.title")}
                        </h2>
                        <span className="text-xs text-muted-foreground">
                            {draft ?
                                t("fin_report.dist.draft_hint")
                            :   t("fin_report.dist.approved_at", {
                                    date:
                                        report.approved_at ?
                                            format(
                                                new Date(report.approved_at),
                                                "dd.MM.yyyy HH:mm",
                                            )
                                        :   "",
                                    name: report.approved_by_name ?? "",
                                })
                            }
                        </span>
                    </div>
                    {canEdit &&
                        (draft ?
                            <Button
                                loading={approving}
                                disabled={dirty || total !== 100}
                                onClick={() =>
                                    approve(reportUrl(report.id, "approve"), {})
                                }
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {t("fin_report.dist.approve")}
                            </Button>
                        :   <Button
                                variant="outline"
                                loading={unapproving}
                                onClick={() =>
                                    unapprove(
                                        reportUrl(report.id, "unapprove"),
                                        {},
                                    )
                                }
                            >
                                <Undo2 className="w-4 h-4" />
                                {t("fin_report.dist.unapprove")}
                            </Button>)}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] table-fixed text-sm">
                        <colgroup>
                            <col className="w-[30%]" />
                            <col className="w-[16%]" />
                            <col className="w-[18%]" />
                            <col className="w-[18%]" />
                            <col className="w-[18%]" />
                        </colgroup>
                        <thead>
                            <tr className="text-muted-foreground text-xs border-b">
                                <th className="text-left font-medium py-2 pr-2">
                                    {t("fin_report.dist.who")}
                                </th>
                                <th className="text-right font-medium py-2 px-2">
                                    {t("fin_report.dist.pct")}
                                </th>
                                <th className="text-right font-medium py-2 px-2">
                                    {t("fin_report.dist.profit_share")}
                                </th>
                                <th className="text-right font-medium py-2 px-2">
                                    {t("fin_report.dist.rent")}
                                </th>
                                <th className="text-right font-medium py-2 pl-2">
                                    {t("fin_report.dist.to_kontragent")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="py-2 pr-2 font-medium">
                                    {t("fin_report.dist.firm")}
                                </td>
                                <td className="py-2 px-2 text-right">
                                    {pctInput(firm, setFirm)}
                                </td>
                                <td className="py-2 px-2 text-right">
                                    <Money
                                        value={Math.round(
                                            (base * num(firm)) / 100,
                                        )}
                                    />
                                </td>
                                <td className="py-2 px-2 text-right text-muted-foreground">
                                    —
                                </td>
                                <td className="py-2 pl-2 text-right text-muted-foreground">
                                    —
                                </td>
                            </tr>
                            {report.shares.map((s) => {
                                const o = owner(s.kontragent)
                                const pct = shares[s.kontragent] ?? "0"
                                const share = Math.round(
                                    (base * num(pct)) / 100,
                                )
                                return (
                                    <tr key={s.kontragent} className="border-b">
                                        <td className="py-2 pr-2">
                                            <Link
                                                to="/kontragentlar/$id"
                                                params={{
                                                    id: String(s.kontragent),
                                                }}
                                                className="font-medium hover:underline"
                                            >
                                                {s.name}
                                            </Link>
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            {pctInput(pct, (v) =>
                                                setShares({
                                                    ...shares,
                                                    [s.kontragent]: v,
                                                }),
                                            )}
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            <Money value={share} />
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                            <Money value={num(o?.rent)} />
                                        </td>
                                        <td className="py-2 pl-2 text-right">
                                            <Money
                                                value={share + num(o?.rent)}
                                                strong
                                            />
                                        </td>
                                    </tr>
                                )
                            })}
                            <tr>
                                <td className="py-2 pr-2 text-xs text-muted-foreground">
                                    {t("fin_report.dist.total")}
                                </td>
                                <td
                                    className={cn(
                                        "py-2 px-2 text-right text-xs font-semibold tabular-nums",
                                        total !== 100 && "text-destructive",
                                    )}
                                >
                                    {total}%
                                </td>
                                <td className="py-2 px-2 text-right">
                                    <Money value={net} strong />
                                </td>
                                <td colSpan={2} />
                            </tr>
                        </tbody>
                    </table>
                </div>

                {total !== 100 && (
                    <p className="text-xs text-destructive">
                        {t("fin_report.dist.must_100")}
                    </p>
                )}
                {net <= 0 && (
                    <p className="text-xs text-muted-foreground">
                        {t("fin_report.dist.no_profit")}
                    </p>
                )}
                {editable && dirty && (
                    <div className="flex justify-end">
                        <Button
                            loading={saving}
                            disabled={total !== 100}
                            onClick={() =>
                                save(reportUrl(report.id), {
                                    firm_share: num(firm),
                                    shares: report.shares.map((s) => ({
                                        kontragent: s.kontragent,
                                        pct: num(shares[s.kontragent]),
                                    })),
                                })
                            }
                        >
                            {t("actions.save")}
                        </Button>
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    {t("fin_report.dist.hint")}
                </p>
            </CardContent>
        </Card>
    )
}
