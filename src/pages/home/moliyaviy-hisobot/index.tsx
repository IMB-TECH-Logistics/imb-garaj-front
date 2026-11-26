import ParamTabs from "@/components/as-params/tabs"
import Modal from "@/components/custom/modal"
import BalancePage from "@/pages/home/balans"
import { PnlMatrix } from "@/pages/home/hisobotlar/natijalar/matrix"
import PulOqimiPage from "@/pages/home/hisobotlar/pul-oqimi"
import KapitalPage from "@/pages/home/hisobotlar/kapital"
import QarzlarPage from "@/pages/home/hisobotlar/qarzlar"
import { Button } from "@/components/ui/button"
import { useHasAction } from "@/constants/useUser"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { cn } from "@/lib/utils"
import { amountText, num, onApiError } from "@/pages/home/kontragent/api"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { format, subMonths } from "date-fns"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { MONTHLY_REPORTS, MonthlyReport, REPORT_CREATE } from "./api"

export const Money = ({
    value,
    strong,
}: {
    value: string | number
    strong?: boolean
}) => (
    <span
        className={cn(
            "tabular-nums whitespace-nowrap",
            strong && "font-semibold",
            num(value) < 0 && "text-destructive",
        )}
    >
        {num(value) < 0 ? "−" : ""}
        {amountText(Math.abs(num(value)))}
    </span>
)

const CreateForm = ({ onCreated }: { onCreated: (id: number) => void }) => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { closeModal } = useModal(REPORT_CREATE)
    const [month, setMonth] = useState(
        format(subMonths(new Date(), 1), "yyyy-MM"),
    )
    const { mutate, isPending } = usePost({
        onSuccess: (data: MonthlyReport) => {
            qc.invalidateQueries({
                predicate: (q) =>
                    String(q.queryKey[0]).startsWith(MONTHLY_REPORTS),
            })
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
                <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                >
                    {Array.from({ length: 24 }, (_, i) => subMonths(new Date(), i)).map((d) => {
                        const value = format(d, "yyyy-MM")
                        const name = t(`core.months.m${d.getMonth() + 1}`)
                        return (
                            <option key={value} value={value}>
                                {name.charAt(0).toUpperCase() + name.slice(1)} {d.getFullYear()}
                            </option>
                        )
                    })}
                </select>
            </label>
            <p className="text-sm text-muted-foreground">
                {t("fin_report.create_hint")}
            </p>
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
    const canEdit = useHasAction("fin_report_control")
    const { openModal } = useModal(REPORT_CREATE)
    const open = (id: number) =>
        navigate({ to: "/moliyaviy-hisobot/$id", params: { id: String(id) } })

    const search = useSearch({ from: "/_main" }) as Record<string, string | undefined>
    const tab = search.fin_tab || "reports"

    return (
        <div className="flex flex-col gap-4">
            <h1 className="sr-only">{t("fin_report.title")}</h1>
            <ParamTabs
                paramName="fin_tab"
                dontCleanOthers={false}
                options={[
                    { value: "reports", label: t("fin_report.tab_reports") },
                    { value: "balans", label: t("balans.title") },
                    { value: "pul_oqimi", label: "Pul oqimi" },
                    { value: "kapital", label: "Kapital o'zgarishi" },
                    { value: "qarzlar", label: "Debitor / Kreditor" },
                ]}
                right={
                    tab === "reports" && canEdit ?
                        <Button onClick={openModal}>
                            <Plus className="w-4 h-4" />
                            {t("fin_report.create")}
                        </Button>
                    :   undefined
                }
            />
            {tab === "balans" ?
                <BalancePage />
            : tab === "pul_oqimi" ?
                <PulOqimiPage />
            : tab === "kapital" ?
                <KapitalPage />
            : tab === "qarzlar" ?
                <QarzlarPage />
            :   <PnlMatrix onOpen={open} />
            }
            <Modal
                title={t("fin_report.create")}
                modalKey={REPORT_CREATE}
                size="max-w-sm"
            >
                <CreateForm onCreated={open} />
            </Modal>
        </div>
    )
}

export default FinanceReportsPage
