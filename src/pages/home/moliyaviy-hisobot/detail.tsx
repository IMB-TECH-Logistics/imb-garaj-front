import DeleteModal from "@/components/custom/delete-modal"
import FormTextarea from "@/components/form/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useHasAction } from "@/constants/useUser"
import { useDownloadAsExcel } from "@/hooks/useDownloadAsExcel"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { cn } from "@/lib/utils"
import { amountText, num, onApiError } from "@/pages/home/kontragent/api"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { format } from "date-fns"
import {
    ArrowLeft,
    ChevronDown,
    Download,
    Check,
    Info,
    Pencil,
    RefreshCw,
    Trash2,
    X,
} from "lucide-react"
import { ReactNode, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
    MONTHLY_REPORTS,
    MonthlyReport,
    OverheadItem,
    OverheadKey,
    REPORT_DELETE,
    reportUrl,
} from "./api"
import { DistributionCard } from "./distribution-card"
import { Money } from "./index"
import { RateEditor } from "./rate-editor"

const USD_RE = /^\d{0,6}(\.\d{0,2})?$/

const usd = (v: string | number) =>
    `$${Math.round(num(v)).toLocaleString("ru-RU").replace(/ /g, " ")}`

const Line = ({
    label,
    value,
    strong,
    tone,
    indent,
    sub,
    onClick,
    open,
}: {
    label: ReactNode
    value: number
    strong?: boolean
    tone?: "head" | "total"
    indent?: boolean
    sub?: boolean
    onClick?: () => void
    open?: boolean
}) => {
    const Tag = onClick ? "button" : "div"
    return (
        <Tag
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className={cn(
                "flex w-full items-center justify-between gap-4 px-4 border-b last:border-b-0 text-left",
                sub ? "py-1.5 bg-muted/10 text-xs" : "py-2.5",
                tone === "head" && "bg-muted/40",
                tone === "total" && "bg-green-500/10",
                onClick && "hover:bg-muted/30 transition-colors",
            )}
        >
            <span
                className={cn(
                    "flex items-center gap-1.5",
                    !sub && "text-sm",
                    indent && "pl-4 text-muted-foreground",
                    sub && "pl-8 text-muted-foreground",
                    strong && "font-semibold text-foreground",
                )}
            >
                {label}
                {onClick && (
                    <ChevronDown
                        className={cn(
                            "w-3.5 h-3.5 transition-transform",
                            open && "rotate-180",
                        )}
                    />
                )}
            </span>
            <Money value={value} strong={strong} />
        </Tag>
    )
}

const Items = ({ items }: { items: OverheadItem[] }) => {
    const { t } = useTranslation()
    if (!items.length) return null
    return (
        <div className="border-b bg-muted/10">
            {items.map((i) => (
                <div
                    key={i.id}
                    className="flex items-center justify-between gap-3 pl-12 pr-4 py-1 text-xs"
                >
                    <span className="min-w-0 truncate text-muted-foreground">
                        {format(new Date(i.date), "dd.MM.yyyy")} · {i.category}
                        {i.comment ? ` · ${i.comment}` : ""}
                    </span>
                    <Money value={-num(i.amount)} />
                </div>
            ))}
        </div>
    )
}

type Section = "other" | "tax" | "management" | "rent" | "leasing"

const OfficeGroups = ({ items }: { items: OverheadItem[] }) => {
    const { t } = useTranslation()
    if (!items.length)
        return (
            <p className="pl-12 pr-4 py-1.5 text-xs text-muted-foreground border-b">
                {t("fin_report.no_office")}
            </p>
        )
    const groups = new Map<string, OverheadItem[]>()
    for (const i of items) groups.set(i.category, [...(groups.get(i.category) ?? []), i])
    return (
        <>
            {[...groups.entries()]
                .map(([category, rows]) => ({
                    category,
                    rows,
                    total: rows.reduce((a, i) => a + num(i.amount), 0),
                }))
                .sort((a, b) => b.total - a.total)
                .map((g) => (
                    <Line key={g.category} sub label={g.category} value={-g.total} />
                ))}
        </>
    )
}

type ManualTaxKey =
    | "tax_profit_manual"
    | "tax_vat_manual"
    | "tax_payroll_manual"
    | "tax_cash_manual"

const groupDigits = (v: string) => v.replace(/\B(?=(\d{3})+(?!\d))/g, " ")

const TaxLine = ({
    label,
    total,
    manual,
    editable,
    saving,
    onSave,
}: {
    label: string
    total: number
    manual: number
    editable: boolean
    saving: boolean
    onSave: (v: number) => void
}) => {
    const { t } = useTranslation()
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState("")
    const kassa = total - manual
    const start = () => {
        setDraft(manual ? String(Math.round(manual)) : "")
        setEditing(true)
    }
    const submit = () => {
        onSave(Number(draft || 0))
        setEditing(false)
    }
    return (
        <div className="flex items-center justify-between gap-3 pl-12 pr-4 py-1.5 text-xs border-b bg-muted/10">
            <span className="flex flex-col text-muted-foreground">
                {label}
                {kassa !== 0 && (
                    <span className="text-[11px]">
                        {t("fin_report.from_kassa")}: {amountText(String(kassa))}
                    </span>
                )}
            </span>
            {editing ?
                <span className="flex h-7 items-center gap-1">
                    <Input
                        autoFocus
                        wrapperClassName="h-7 w-36 sm:w-36"
                        className="h-7 w-36 text-right text-xs"
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={groupDigits(draft)}
                        onChange={(e) =>
                            setDraft(
                                e.target.value
                                    .replace(/\D/g, "")
                                    .replace(/^0+(?=\d)/, "")
                                    .slice(0, 15),
                            )
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter") submit()
                            if (e.key === "Escape") setEditing(false)
                        }}
                    />
                    <Button
                        size="icon"
                        className="h-7 w-7"
                        loading={saving}
                        onClick={submit}
                    >
                        <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setEditing(false)}
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </span>
            :   <span className="flex items-center gap-1.5">
                    <Money value={-total} />
                    {editable && (
                        <button
                            type="button"
                            onClick={start}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    )}
                </span>
            }
        </div>
    )
}

const FinanceReportDetail = ({ id }: { id: number }) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const qc = useQueryClient()
    const canEdit = useHasAction("fin_report_control")
    const { data: r, isLoading } = useGet<MonthlyReport>(reportUrl(id))
    const { data: overheadItems = [] } = useGet<OverheadItem[]>(
        reportUrl(id, "overhead"),
        { params: { at: r?.computed_at ?? undefined }, enabled: !!r },
    )
    const [open, setOpen] = useState<Section | null>(null)
    const toggle = (s: Section) => () => setOpen(open === s ? null : s)
    const { openModal: openDelete } = useModal(REPORT_DELETE)
    const refresh = () =>
        qc.invalidateQueries({
            predicate: (q) => String(q.queryKey[0]).startsWith("kontragent"),
        })
    const excel = useDownloadAsExcel({
        url: reportUrl(id, "excel"),
        name: r ? `moliyaviy_hisobot_${r.month}` : "moliyaviy_hisobot",
    })
    const [feeUsd, setFeeUsd] = useState("")
    useEffect(
        () => setFeeUsd(r ? String(num(r.management_fee_usd)) : ""),
        [r?.management_fee_usd],
    )

    const form = useForm<{ comment: string }>({
        defaultValues: { comment: "" },
    })
    useEffect(() => {
        if (r) form.reset({ comment: r.comment })
    }, [r?.id, r?.updated])

    const { mutate: save, isPending: saving } = usePatch({
        onSuccess: () => {
            toast.success(t("messages.success_edit"))
            refresh()
        },
        onError: onApiError(t("messages.error")),
    })
    const { mutate: recalc, isPending: recalculating } = usePost({
        onSuccess: () => {
            toast.success(t("fin_report.recalculated"))
            refresh()
        },
        onError: onApiError(t("messages.error")),
    })

    if (isLoading || !r)
        return (
            <p className="text-sm text-muted-foreground">
                {t("fin_report.loading")}
            </p>
        )

    const draft = r.status === "draft"
    const editable = canEdit && draft
    const byLine = (k: OverheadKey) => overheadItems.filter((i) => i.line === k)
    const rentParts = (["head", "trailer"] as const)
        .map((part) => {
            const rows = r.owners
                .flatMap((o) =>
                    o.vehicles.map((v) => ({ ...v, owner: o.name })),
                )
                .filter((v) => v.part === part)
                .sort((x, y) => x.plate.localeCompare(y.plate))
            return {
                part,
                rows,
                total: rows.reduce((acc, v) => acc + num(v.rent), 0),
                owners: [...new Set(rows.map((v) => v.owner))].join(", "),
            }
        })
        .filter((g) => g.rows.length > 0)

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label={t("actions.back")}
                        onClick={() => navigate({ to: "/moliyaviy-hisobot" })}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold">
                                {r.month_label}
                            </h1>
                            <Badge
                                variant="outline"
                                className={cn(
                                    draft ?
                                        "border-amber-500/40 text-amber-600"
                                    :   "border-green-600/40 text-green-600",
                                )}
                            >
                                {draft ?
                                    t("fin_report.status.draft")
                                :   t("fin_report.status.approved")}
                            </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {t("fin_report.counts", {
                                trips: r.trip_count,
                                orders: r.order_count,
                            })}
                            {r.computed_at ?
                                ` · ${t("fin_report.computed_at")}: ${format(new Date(r.computed_at), "dd.MM.yyyy HH:mm")}`
                            :   ""}
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {editable && (
                        <Button
                            variant="outline"
                            onClick={() =>
                                recalc(reportUrl(id, "recalculate"), {})
                            }
                            loading={recalculating}
                        >
                            <RefreshCw className="w-4 h-4" />
                            {t("fin_report.recalculate")}
                        </Button>
                    )}
                    <Button
                        onClick={() => excel.trigger()}
                        loading={excel.isFetching}
                    >
                        <Download className="w-4 h-4" />
                        {t("fin_report.download")}
                    </Button>
                    {editable && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            aria-label={t("actions.delete")}
                            onClick={openDelete}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {(r.fleet > 0 || !!r.usd_rate) && <RateEditor report={r} />}

            {r.unpriced_count > 0 && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                    {t("fin_report.unpriced_warning", {
                        count: r.unpriced_count,
                    })}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)] gap-4 items-start">
                <div className="flex flex-col gap-4 min-w-0">
                    <Card>
                        <CardContent className="p-0">
                            <Line
                                label={t("fin_report.lines.income")}
                                value={num(r.income)}
                            />
                            <Line
                                label={t("fin_report.lines.trip_expense")}
                                value={-num(r.trip_expense)}
                            />
                            {(
                                ["trip_fuel", "trip_salary", "trip_other"] as const
                            ).map((k) => (
                                <Line
                                    key={k}
                                    sub
                                    label={t(`fin_report.lines.${k}`)}
                                    value={-num(r[k])}
                                />
                            ))}

                            <Line
                                label={t("fin_report.lines.other_expense")}
                                value={-num(r.other_expense)}
                                open={open === "other"}
                                onClick={toggle("other")}
                            />
                            {open === "other" && (
                                <>
                                    <Line
                                        sub
                                        label={t(
                                            "fin_report.lines.company_vehicle_expense",
                                        )}
                                        value={-num(r.company_vehicle_expense)}
                                    />
                                    {num(r.recoverable) > 0 && (
                                        <p className="pl-12 pr-4 py-1 text-xs text-muted-foreground border-b">
                                            {t("fin_report.recoverable_note", {
                                                amount: amountText(
                                                    r.recoverable,
                                                ),
                                            })}
                                        </p>
                                    )}
                                    <Line
                                        sub
                                        label={t(
                                            "fin_report.lines.other_kassa",
                                        )}
                                        value={-num(r.other)}
                                    />
                                    <Items items={byLine("other")} />
                                </>
                            )}

                            <Line
                                label={t("fin_report.lines.profit")}
                                value={num(r.profit)}
                                strong
                                tone="head"
                            />

                            {!r.leasing_mode && (
                            <>
                            <Line
                                label={t("fin_report.lines.tax")}
                                value={-num(r.tax_total)}
                                indent
                                open={open === "tax"}
                                onClick={toggle("tax")}
                            />
                            {open === "tax" && (
                                <>
                                    {(
                                        [
                                            "tax_profit",
                                            "tax_vat",
                                            "tax_payroll",
                                            "tax_cash",
                                        ] as const
                                    ).map((k) => (
                                        <div key={k}>
                                            <TaxLine
                                                label={t(
                                                    `fin_report.lines.${k}`,
                                                )}
                                                total={num(r[k])}
                                                manual={num(
                                                    r[
                                                        `${k}_manual` as ManualTaxKey
                                                    ] ?? "0",
                                                )}
                                                editable={editable}
                                                saving={saving}
                                                onSave={(v) =>
                                                    save(reportUrl(id), {
                                                        [`${k}_manual`]: v,
                                                    })
                                                }
                                            />
                                            <Items items={byLine(k)} />
                                        </div>
                                    ))}
                                    {num(r.tax) !== 0 && (
                                        <>
                                            <Line
                                                sub
                                                label={t(
                                                    "fin_report.lines.tax_other",
                                                )}
                                                value={-num(r.tax)}
                                            />
                                            <Items items={byLine("tax")} />
                                        </>
                                    )}
                                </>
                            )}

                            </>
                            )}

                            <Line
                                label={
                                    r.leasing_mode ?
                                        t("fin_report.lines.office")
                                    :   t("fin_report.lines.management")
                                }
                                value={-num(r.management_total)}
                                indent
                                open={open === "management"}
                                onClick={toggle("management")}
                            />
                            {open === "management" && r.leasing_mode && (
                                <OfficeGroups items={byLine("management")} />
                            )}
                            {open === "management" && !r.leasing_mode && (
                                <>
                                    <div className="flex items-center justify-between gap-3 pl-12 pr-4 py-1.5 text-xs border-b bg-muted/10">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            {editable ?
                                                <>
                                                    $
                                                    <Input
                                                        wrapperClassName="h-7 w-20 sm:w-20"
                                                        className="h-7 w-20 text-right text-xs"
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={feeUsd}
                                                        onChange={(e) => {
                                                            const v =
                                                                e.target.value.replace(
                                                                    ",",
                                                                    ".",
                                                                )
                                                            if (USD_RE.test(v))
                                                                setFeeUsd(v)
                                                        }}
                                                    />
                                                    {num(feeUsd) !==
                                                        num(
                                                            r.management_fee_usd,
                                                        ) && (
                                                        <Button
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                            loading={saving}
                                                            onClick={() =>
                                                                save(
                                                                    reportUrl(
                                                                        id,
                                                                    ),
                                                                    {
                                                                        management_fee_usd:
                                                                            num(
                                                                                feeUsd,
                                                                            ),
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            {t("actions.save")}
                                                        </Button>
                                                    )}
                                                </>
                                            :   usd(r.management_fee_usd)}
                                            ×{" "}
                                            {t("fin_report.fleet", {
                                                count: r.fleet,
                                            })}
                                        </span>
                                        <Money value={-num(r.management_fee)} />
                                    </div>
                                    <Line
                                        sub
                                        label={t(
                                            "fin_report.lines.management_kassa",
                                        )}
                                        value={-num(r.management)}
                                    />
                                    <Items items={byLine("management")} />
                                </>
                            )}

                            {(!r.leasing_mode || num(r.rent_total) !== 0) && (
                            <>
                            <Line
                                label={t("fin_report.lines.rent")}
                                value={-num(r.rent_total)}
                                indent
                                open={open === "rent"}
                                onClick={toggle("rent")}
                            />
                            {open === "rent" && (
                                <>
                                    {rentParts.length === 0 && (
                                        <p className="pl-12 pr-4 py-1.5 text-xs text-muted-foreground border-b">
                                            {t("fin_report.no_rent")}
                                        </p>
                                    )}
                                    {rentParts.map((g) => (
                                        <div key={g.part}>
                                            <Line
                                                sub
                                                label={`${t(`fin_report.part.${g.part}`)} → ${g.owners}`}
                                                value={-g.total}
                                            />
                                            {g.rows.map((v) => (
                                                <div
                                                    key={`${v.vehicle}-${v.part}`}
                                                    className="flex items-center justify-between gap-3 pl-12 pr-4 py-1 text-xs border-b bg-muted/10"
                                                >
                                                    <span className="flex min-w-0 items-center gap-1.5 pl-4 text-muted-foreground">
                                                        <span className="truncate">
                                                            {v.plate}
                                                        </span>
                                                        <TooltipProvider
                                                            delayDuration={100}
                                                        >
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Info
                                                                        className="h-3.5 w-3.5 shrink-0 cursor-help"
                                                                        aria-label={t(
                                                                            "fin_report.rent_info",
                                                                        )}
                                                                    />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {t(
                                                                        `fin_report.part.${v.part}`,
                                                                    )}{" "}
                                                                    ·{" "}
                                                                    {usd(
                                                                        v.rent_usd,
                                                                    )}{" "}
                                                                    +{" "}
                                                                    {num(
                                                                        v.vat_percent,
                                                                    )}
                                                                    %{" "}
                                                                    {t(
                                                                        "fin_report.vat",
                                                                    )}{" "}
                                                                    → {v.owner}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </span>
                                                    <Money
                                                        value={-num(v.rent)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                    {num(r.rent) !== 0 && (
                                        <>
                                            <Line
                                                sub
                                                label={t(
                                                    "fin_report.lines.rent_kassa",
                                                )}
                                                value={-num(r.rent)}
                                            />
                                            <Items items={byLine("rent")} />
                                        </>
                                    )}
                                </>
                            )}

                            </>
                            )}

                            <Line
                                label={t("fin_report.lines.net")}
                                value={num(r.net)}
                                strong
                                tone="total"
                            />

                            {r.leasing_mode && (
                                <>
                                    <Line
                                        label={t("fin_report.lines.leasing")}
                                        value={-num(r.leasing_total)}
                                        indent
                                        open={open === "leasing"}
                                        onClick={toggle("leasing")}
                                    />
                                    {open === "leasing" &&
                                        r.owners
                                            .filter((o) => (o.leasing_vehicles ?? []).length > 0)
                                            .map((o) => (
                                                <div key={o.kontragent}>
                                                    <Line sub label={o.name} value={-num(o.leasing)} />
                                                    {(o.leasing_vehicles ?? []).map((v) => (
                                                        <TaxLine
                                                            key={v.vehicle}
                                                            label={v.plate}
                                                            total={num(v.amount)}
                                                            manual={num(v.amount)}
                                                            editable={editable}
                                                            saving={saving}
                                                            onSave={(val) =>
                                                                save(reportUrl(id), {
                                                                    leasing: { [String(v.vehicle)]: val },
                                                                })
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            ))}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <p className="text-xs text-muted-foreground">
                        {t("fin_report.overhead_hint")}
                    </p>

                    {canEdit ?
                        <Card>
                            <CardContent className="p-4 flex flex-col gap-3">
                                <FormTextarea
                                    name="comment"
                                    label={t("fin_report.comment")}
                                    methods={form}
                                    rows={2}
                                />
                                <div className="flex justify-end">
                                    <Button
                                        loading={saving}
                                        onClick={form.handleSubmit((v) =>
                                            save(reportUrl(id), {
                                                comment: v.comment.trim(),
                                            }),
                                        )}
                                    >
                                        {t("actions.save")}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    : r.comment ?
                        <p className="text-sm text-muted-foreground">
                            {t("fin_report.comment")}: {r.comment}
                        </p>
                    :   null}
                </div>
                <div className="flex flex-col gap-4 min-w-0">
                    <DistributionCard report={r} />
                </div>
            </div>

            <DeleteModal
                path={MONTHLY_REPORTS}
                id={id}
                name={r.month_label}
                modalKey={REPORT_DELETE}
                disableRefetch
                onSuccessAction={refresh}
                url="/moliyaviy-hisobot"
            />
        </div>
    )
}

export default FinanceReportDetail
