import DeleteModal from "@/components/custom/delete-modal"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { useHasAction } from "@/constants/useUser"
import { useDownloadAsExcel } from "@/hooks/useDownloadAsExcel"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { cn } from "@/lib/utils"
import { num, onApiError } from "@/pages/home/kontragent/api"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import {
    ArrowLeft,
    ChevronDown,
    Download,
    RefreshCw,
    Trash2,
} from "lucide-react"
import { ReactNode, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
    MONTHLY_REPORTS,
    MonthlyReport,
    OVERHEAD_KEYS,
    OverheadItem,
    OverheadKey,
    REPORT_DELETE,
    VehicleRow,
    reportUrl,
} from "./api"
import { Money } from "./index"
import { OwnersCard } from "./owners-card"
import { RateEditor } from "./rate-editor"

const Line = ({
    label,
    value,
    strong,
    tone,
    indent,
    onClick,
    open,
}: {
    label: ReactNode
    value: number
    strong?: boolean
    tone?: "head" | "total"
    indent?: boolean
    onClick?: () => void
    open?: boolean
}) => {
    const Tag = onClick ? "button" : "div"
    return (
        <Tag
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className={cn(
                "flex w-full items-center justify-between gap-4 px-4 py-2.5 border-b last:border-b-0 text-left",
                tone === "head" && "bg-muted/40",
                tone === "total" && "bg-green-500/10",
                onClick && "hover:bg-muted/30 transition-colors",
            )}
        >
            <span
                className={cn(
                    "flex items-center gap-1.5 text-sm",
                    indent && "pl-4 text-muted-foreground",
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

const OverheadList = ({ items }: { items: OverheadItem[] }) => {
    const { t } = useTranslation()
    if (!items.length)
        return (
            <p className="px-8 py-2 text-xs text-muted-foreground border-b">
                {t("fin_report.overhead_empty")}
            </p>
        )
    return (
        <div className="border-b bg-muted/10">
            {items.map((i) => (
                <div
                    key={i.id}
                    className="flex items-center justify-between gap-3 px-8 py-1.5 text-xs"
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

const VehiclesCard = ({ id, stamp }: { id: number; stamp?: string | null }) => {
    const { t } = useTranslation()
    const { data = [], isLoading } = useGet<VehicleRow[]>(
        reportUrl(id, "vehicles"),
        { params: { at: stamp ?? undefined } },
    )
    const rows = useMemo(
        () =>
            [...data]
                .sort((a, b) => num(b.net) - num(a.net))
                .map((r, i) => ({ ...r, id: i + 1 })),
        [data],
    )
    const columns = useMemo<ColumnDef<VehicleRow>[]>(
        () => [
            {
                accessorKey: "truck_number",
                header: t("fin_report.vehicle"),
                cell: ({ row }) => (
                    <span className="font-medium whitespace-nowrap">
                        {row.original.truck_number}
                    </span>
                ),
            },
            {
                accessorKey: "trip_count",
                header: t("fin_report.trips"),
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original.trip_count}
                    </span>
                ),
            },
            {
                accessorKey: "income",
                header: t("fin_report.income_short"),
                cell: ({ row }) => <Money value={row.original.income} />,
            },
            {
                id: "expense",
                header: t("fin_report.expense_total"),
                cell: ({ row }) => (
                    <Money
                        value={
                            -(
                                num(row.original.trip_expense) +
                                num(row.original.vehicle_expense)
                            )
                        }
                    />
                ),
            },
            {
                accessorKey: "net",
                header: t("fin_report.lines.profit"),
                cell: ({ row }) => <Money value={row.original.net} strong />,
            },
        ],
        [t],
    )
    return (
        <Card className="min-w-0">
            <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold">
                        {t("fin_report.by_vehicle")}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                        {t("fin_report.by_vehicle_hint")}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <DataTable
                        className="min-w-0"
                        columns={columns}
                        data={rows}
                        loading={isLoading}
                        viewAll
                        wrapperClassName="p-0"
                    />
                </div>
            </CardContent>
        </Card>
    )
}

const FinanceReportDetail = ({ id }: { id: number }) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const qc = useQueryClient()
    const canEdit = useHasAction("investor_control")
    const { data: r, isLoading } = useGet<MonthlyReport>(reportUrl(id))
    const { data: overheadItems = [] } = useGet<OverheadItem[]>(
        reportUrl(id, "overhead"),
        { params: { at: r?.computed_at ?? undefined }, enabled: !!r },
    )
    const [openLine, setOpenLine] = useState<OverheadKey | null>(null)
    const { openModal: openDelete } = useModal(REPORT_DELETE)
    const refresh = () =>
        qc.invalidateQueries({
            predicate: (q) => String(q.queryKey[0]).startsWith(MONTHLY_REPORTS),
        })
    const excel = useDownloadAsExcel({
        url: reportUrl(id, "excel"),
        name: r ? `moliyaviy_hisobot_${r.month}` : "moliyaviy_hisobot",
    })

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

    const noOverhead = num(r.overhead) === 0

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
                        <h1 className="text-xl font-semibold">
                            {r.month_label}
                        </h1>
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
                    {canEdit && (
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
                    {canEdit && (
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

            {(r.owners?.length > 0 || r.usd_rate) && <RateEditor report={r} />}

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
                                indent
                            />
                            <Line
                                label={t("fin_report.lines.trip_profit")}
                                value={num(r.trip_profit)}
                                strong
                                tone="head"
                            />
                            <Line
                                label={t(
                                    "fin_report.lines.company_vehicle_expense",
                                )}
                                value={-num(r.company_vehicle_expense)}
                                indent
                            />
                            {num(r.recoverable) > 0 && (
                                <p className="px-8 py-1.5 text-xs text-muted-foreground border-b">
                                    {t("fin_report.recoverable_note", {
                                        amount: num(r.recoverable)
                                            .toLocaleString("ru-RU")
                                            .replace(/\u00a0/g, " "),
                                    })}
                                </p>
                            )}
                            <Line
                                label={t("fin_report.lines.profit")}
                                value={num(r.profit)}
                                strong
                                tone="head"
                            />
                            {(num(r.vehicle_rent) > 0 ||
                                r.owners?.length > 0) && (
                                <Line
                                    label={t("fin_report.lines.vehicle_rent")}
                                    value={-num(r.vehicle_rent)}
                                    indent
                                />
                            )}
                            {OVERHEAD_KEYS.map((k) => (
                                <div key={k}>
                                    <Line
                                        label={t(`fin_report.lines.${k}`)}
                                        value={-num(r[k])}
                                        indent
                                        open={openLine === k}
                                        onClick={() =>
                                            setOpenLine(
                                                openLine === k ? null : k,
                                            )
                                        }
                                    />
                                    {openLine === k && (
                                        <OverheadList
                                            items={overheadItems.filter(
                                                (i) => i.line === k,
                                            )}
                                        />
                                    )}
                                </div>
                            ))}
                            <Line
                                label={t("fin_report.lines.net")}
                                value={num(r.net)}
                                strong
                                tone="total"
                            />
                        </CardContent>
                    </Card>

                    <p
                        className={cn(
                            "text-xs",
                            noOverhead ?
                                "rounded-md border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-blue-700 dark:text-blue-300"
                            :   "text-muted-foreground",
                        )}
                    >
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
                    <OwnersCard report={r} />
                    <VehiclesCard id={id} stamp={r.computed_at} />
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
