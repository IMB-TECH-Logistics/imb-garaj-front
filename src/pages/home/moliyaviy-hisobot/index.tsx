import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Input } from "@/components/ui/input"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { cn } from "@/lib/utils"
import { amountText, num, onApiError } from "@/pages/home/kontragent/api"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format, subMonths } from "date-fns"
import { Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { MONTHLY_REPORTS, MonthlyReport, REPORT_CREATE } from "./api"

export const Money = ({ value, strong }: { value: string | number; strong?: boolean }) => (
    <span className={cn("tabular-nums whitespace-nowrap", strong && "font-semibold", num(value) < 0 && "text-destructive")}>
        {num(value) < 0 ? "−" : ""}
        {amountText(Math.abs(num(value)))}
    </span>
)

const CreateForm = ({ onCreated }: { onCreated: (id: number) => void }) => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { closeModal } = useModal(REPORT_CREATE)
    const [month, setMonth] = useState(format(subMonths(new Date(), 1), "yyyy-MM"))
    const { mutate, isPending } = usePost({
        onSuccess: (data: MonthlyReport) => {
            qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith(MONTHLY_REPORTS) })
            closeModal()
            onCreated(data.id)
        },
        onError: onApiError(t("messages.error")),
    })
    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
                e.preventDefault()
                if (month) mutate(MONTHLY_REPORTS, { month })
            }}
        >
            <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("fin_report.month")}
                <Input type="month" value={month} max={format(new Date(), "yyyy-MM")} onChange={(e) => setMonth(e.target.value)} required />
            </label>
            <p className="text-sm text-muted-foreground">{t("fin_report.create_hint")}</p>
            <div className="flex justify-end">
                <Button type="submit" loading={isPending}>
                    {t("fin_report.create")}
                </Button>
            </div>
        </form>
    )
}

const FinanceReportsPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const canEdit = useHasAction("investor_control")
    const { openModal } = useModal(REPORT_CREATE)
    const { data = [], isLoading } = useGet<MonthlyReport[]>(MONTHLY_REPORTS)
    const open = (id: number) => navigate({ to: "/moliyaviy-hisobot/$id", params: { id: String(id) } })

    const columns = useMemo<ColumnDef<MonthlyReport>[]>(
        () => [
            {
                accessorKey: "month_label",
                header: t("fin_report.month"),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{row.original.month_label}</span>
                        {row.original.unpriced_count > 0 && (
                            <Badge variant="outline" className="border-amber-500/40 text-amber-600">
                                {t("fin_report.unpriced_short", { count: row.original.unpriced_count })}
                            </Badge>
                        )}
                    </div>
                ),
            },
            { accessorKey: "income", header: t("fin_report.lines.income"), cell: ({ row }) => <Money value={row.original.income} /> },
            { accessorKey: "profit", header: t("fin_report.lines.profit"), cell: ({ row }) => <Money value={row.original.profit} /> },
            { accessorKey: "overhead", header: t("fin_report.lines.overhead"), cell: ({ row }) => <Money value={-num(row.original.overhead)} /> },
            { accessorKey: "net", header: t("fin_report.lines.net"), cell: ({ row }) => <Money value={row.original.net} strong /> },
            {
                accessorKey: "computed_at",
                header: t("fin_report.computed_at"),
                cell: ({ row }) => (
                    <span className="text-muted-foreground whitespace-nowrap">
                        {row.original.computed_at ? format(new Date(row.original.computed_at), "dd.MM.yyyy HH:mm") : "—"}
                    </span>
                ),
            },
        ],
        [t],
    )

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-semibold">{t("fin_report.title")}</h1>
                {canEdit && (
                    <Button onClick={openModal}>
                        <Plus className="w-4 h-4" />
                        {t("fin_report.create")}
                    </Button>
                )}
            </div>
            <Card>
                <CardContent className="p-4">
                    <DataTable columns={columns} data={data} loading={isLoading} numeration wrapperClassName="p-0" onRowClick={(r) => open(r.id)} />
                </CardContent>
            </Card>
            <Modal title={t("fin_report.create")} modalKey={REPORT_CREATE} size="max-w-sm">
                <CreateForm onCreated={open} />
            </Modal>
        </div>
    )
}

export default FinanceReportsPage
