import { ParamCombobox } from "@/components/as-params/combobox"
import ParamDateRange from "@/components/as-params/date-picker-range"
import Modal from "@/components/custom/modal"
import DownloadAsExcel from "@/components/download-as-excel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { KASSA_PAYER_REPORTS, KASSA_PAYERS, KASSA_PAYMENT_REQUESTS } from "@/constants/api-endpoints"
import { useHasAction, useUser } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format, startOfMonth } from "date-fns"
import { Check, FileCheck2, X } from "lucide-react"
import { ReactNode, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import DecisionRejectModal from "../decision-reject-modal"
import { formatDateTime, type PayerReportData, type PayerReportListRow, type PayerReportRow } from "./types"

type Props = { switcher: ReactNode }

const REPORT_STATUS_VARIANT: Record<number, "secondary" | "default" | "destructive" | "orange"> = {
    10: "secondary",
    20: "orange",
    30: "default",
    [-10]: "destructive",
}

const VstPayerReport = ({ switcher }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const search = useSearch({ strict: false }) as any
    const { data: profile } = useUser()
    const hasApprove = useHasAction("manager_cashflow_approve_control")
    const { data: payers } = useGet<{ id: number; name: string }[]>(KASSA_PAYERS)
    const [selectedReport, setSelectedReport] = useState<number | null>(null)
    const { openModal: openReject } = useModal("vst-report-reject")
    const { openModal: openDetail } = useModal("vst-report-detail")

    const today = new Date()
    const fromDate = search.from_date ?? format(startOfMonth(today), "yyyy-MM-dd")
    const toDate = search.to_date ?? format(today, "yyyy-MM-dd")
    const isPayerOnly = !profile?.is_superuser && !!profile?.actions?.includes("kassa_payer_view") &&
        !profile?.actions?.includes("kassa_payment_requests_view")
    const payerId = search.rp_payer ?? (isPayerOnly ? profile?.id : payers?.length === 1 ? payers[0].id : undefined)

    const previewParams = { payer: payerId, from_date: fromDate, to_date: toDate }
    const { data: preview, isLoading } = useGet<PayerReportData>(`${KASSA_PAYER_REPORTS}/preview`, {
        params: previewParams,
        enabled: !!payerId,
    })
    const { data: reports } = useGet<ListResponse<PayerReportListRow>>(KASSA_PAYER_REPORTS, {
        params: { payer: payerId, page_size: 20 },
    })
    const { data: detail } = useGet<PayerReportData>(`${KASSA_PAYER_REPORTS}/${selectedReport}`, {
        enabled: !!selectedReport,
    })

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: [KASSA_PAYER_REPORTS] })
        queryClient.invalidateQueries({ queryKey: [`${KASSA_PAYER_REPORTS}/preview`] })
        queryClient.invalidateQueries({ queryKey: [KASSA_PAYMENT_REQUESTS] })
    }

    const { mutate: submit, isPending: submitting } = usePost({
        onSuccess: () => {
            toast.success(t("vst.report_submitted", "Hisobot topshirildi"))
            refresh()
        },
        meta: { skipGlobalError: true },
    })
    const { mutate: decide } = usePost({
        onSuccess: () => {
            toast.success(t("toast.updated"))
            refresh()
        },
        meta: { skipGlobalError: true },
    })

    const unreported = (preview?.rows ?? []).filter((r) => !r.payer_report)

    const columns = useMemo<ColumnDef<PayerReportRow>[]>(
        () => [
            {
                header: t("form.date"),
                accessorKey: "paid_at",
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.paid_at)}</span>,
            },
            {
                header: t("vst.recipient", "Kimga"),
                accessorKey: "driver_name",
                cell: ({ row }) => row.original.driver_name || row.original.category || "—",
            },
            {
                header: t("vst.vehicle_short", "Mashina"),
                accessorKey: "vehicle",
                cell: ({ row }) => row.original.vehicle || "—",
            },
            {
                header: t("form.amount"),
                accessorKey: "amount",
                cell: ({ row }) => <span className="font-medium">{formatMoney(Number(row.original.amount))}</span>,
            },
            {
                header: t("vst.creator", "So'ragan"),
                accessorKey: "creator_name",
                cell: ({ row }) => row.original.creator_name || "—",
            },
            {
                header: t("form.comment"),
                accessorKey: "comment",
                cell: ({ row }) => row.original.comment || "—",
            },
            {
                header: t("vst.in_report", "Hisobotda"),
                accessorKey: "payer_report",
                cell: ({ row }) => (row.original.payer_report ? `#${row.original.payer_report}` : "—"),
            },
        ],
        [t],
    )

    return (
        <>
            <DataTable
                numeration
                loading={isLoading}
                columns={columns}
                data={preview?.rows}
                wrapperClassName="md:h-full flex flex-col"
                tableWrapperClassName="flex-1 min-h-0 overflow-auto"
                head={
                    <div className="flex flex-col gap-3 mb-3">
                        <div className="flex flex-wrap justify-between items-center gap-3">
                            <div className="flex items-center gap-2 flex-wrap">{switcher}</div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {!isPayerOnly && (
                                    <ParamCombobox
                                        paramName="rp_payer"
                                        isSearch={false}
                                        label={t("vst.payer", "To'lovchi")}
                                        options={payers ?? []}
                                        addButtonProps={{ className: "!bg-background dark:!bg-secondary min-w-36 justify-start" }}
                                    />
                                )}
                                <ParamDateRange from="from_date" to="to_date" />
                                {payerId && (
                                    <DownloadAsExcel
                                        url={`${KASSA_PAYER_REPORTS}/preview/excel`}
                                        name={t("vst.report_tab", "To'lovchi hisoboti")}
                                        params={previewParams}
                                    />
                                )}
                                {payerId && (
                                    <Button
                                        className="gap-1"
                                        disabled={!unreported.length}
                                        loading={submitting}
                                        onClick={() =>
                                            submit(
                                                KASSA_PAYER_REPORTS,
                                                { payer: payerId, from_date: fromDate, to_date: toDate },
                                                { onError: (e: unknown) => handleFormError(e) },
                                            )
                                        }
                                    >
                                        <FileCheck2 size={16} />
                                        {t("vst.submit_report", "Hisobot topshirish")}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="rounded-lg border bg-card p-3">
                                <p className="text-sm text-muted-foreground">{t("vst.period_total", "Davrda berilgan")}</p>
                                <p className="text-xl font-semibold">
                                    {formatMoney(Number(preview?.total ?? 0))} {t("page.som")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {preview?.count ?? 0} {t("vst.payments", "ta to'lov")} · {t("vst.not_reported", "hisobotga kirmagan")}: {unreported.length}
                                </p>
                            </div>
                            <div className="rounded-lg border bg-card p-3 max-h-32 overflow-auto">
                                <p className="text-sm text-muted-foreground mb-1">{t("vst.by_driver", "Haydovchilar bo'yicha")}</p>
                                {(preview?.by_driver ?? []).map((r) => (
                                    <div key={r.name} className="flex justify-between text-sm">
                                        <span className="truncate">{r.name}</span>
                                        <span>{formatMoney(Number(r.amount))}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-lg border bg-card p-3 max-h-32 overflow-auto">
                                <p className="text-sm text-muted-foreground mb-1">{t("vst.by_category", "Xarajatlar bo'yicha")}</p>
                                {(preview?.by_category ?? []).map((r) => (
                                    <div key={r.name} className="flex justify-between text-sm">
                                        <span className="truncate">{r.name}</span>
                                        <span>{formatMoney(Number(r.amount))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {!!reports?.results?.length && (
                            <div className="rounded-lg border bg-card p-2">
                                <p className="text-sm font-medium mb-1 px-1">{t("vst.reports", "Topshirilgan hisobotlar")}</p>
                                <div className="max-h-40 overflow-auto divide-y">
                                    {reports.results.map((r) => (
                                        <div key={r.id} className="flex items-center justify-between gap-2 px-1 py-1.5 text-sm">
                                            <button
                                                type="button"
                                                className="text-left hover:underline"
                                                onClick={() => {
                                                    setSelectedReport(r.id)
                                                    openDetail()
                                                }}
                                            >
                                                #{r.id} · {r.payer_name} · {r.from_date} – {r.to_date}
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{formatMoney(Number(r.total))}</span>
                                                <Badge variant={REPORT_STATUS_VARIANT[r.status] ?? "secondary"}>{r.status_display}</Badge>
                                                <DownloadAsExcel url={`${KASSA_PAYER_REPORTS}/${r.id}/excel`} name={`hisobot_${r.id}`} />
                                                {hasApprove && r.status === 20 && r.payer !== profile?.id && (
                                                    <>
                                                        <Button
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            title={t("vst.approve", "Tasdiqlash")}
                                                            onClick={() =>
                                                                decide(`${KASSA_PAYER_REPORTS}/${r.id}/decision`, { status: 30 }, {
                                                                    onError: (e: unknown) => handleFormError(e),
                                                                })
                                                            }
                                                        >
                                                            <Check size={16} />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="h-8 w-8 text-destructive"
                                                            title={t("vst.reject", "Rad etish")}
                                                            onClick={() => {
                                                                setSelectedReport(r.id)
                                                                openReject()
                                                            }}
                                                        >
                                                            <X size={16} />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                }
            />
            <Modal modalKey="vst-report-reject" title={t("vst.reject_report", "Hisobotni rad etish")} size="max-w-md">
                <DecisionRejectModal
                    modalKey="vst-report-reject"
                    url={selectedReport ? `${KASSA_PAYER_REPORTS}/${selectedReport}/decision` : undefined}
                    rejectStatus={-10}
                    refetchKeys={[KASSA_PAYER_REPORTS, `${KASSA_PAYER_REPORTS}/preview`]}
                />
            </Modal>
            <Modal modalKey="vst-report-detail" title={`${t("vst.report", "Hisobot")} #${selectedReport ?? ""}`} size="max-w-3xl">
                <div className="flex flex-col gap-2 max-h-[70vh] overflow-auto">
                    <div className="flex justify-between text-sm">
                        <span>{detail?.payer_name} · {detail?.from_date} – {detail?.to_date}</span>
                        <span className="font-semibold">{formatMoney(Number(detail?.total ?? 0))} {t("page.som")}</span>
                    </div>
                    <div className="divide-y text-sm">
                        {(detail?.rows ?? []).map((r) => (
                            <div key={r.id} className="grid grid-cols-[130px_1fr_110px] gap-2 py-1">
                                <span className="text-muted-foreground">{formatDateTime(r.paid_at)}</span>
                                <span className="truncate">{r.driver_name || r.category}{r.vehicle ? ` · ${r.vehicle}` : ""}{r.comment ? ` — ${r.comment}` : ""}</span>
                                <span className="text-right">{formatMoney(Number(r.amount))}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default VstPayerReport
