import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowLeft, HandCoins, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { AddInvestmentForm, AddLoanForm, RepayLoanForm } from "./forms"
import { StatCard } from "./index"
import { Investment, LoanRow, investorRows, loanRows, pct, useInvestorsStore, usd } from "./store"

const d = (v: string | null) => (v ? format(new Date(v), "dd.MM.yyyy") : "—")

const STATUS_STYLE: Record<LoanRow["status"], string> = {
    open: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    partial: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    overdue: "bg-red-500/10 text-red-600 border-red-500/30",
    paid: "bg-green-500/10 text-green-600 border-green-500/30",
}

const Section = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
    <Card>
        <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">{title}</h2>
                {action}
            </div>
            {children}
        </CardContent>
    </Card>
)

const InvestorDetail = ({ id }: { id: number }) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const investors = useInvestorsStore((s) => s.investors)
    const investments = useInvestorsStore((s) => s.investments)
    const loans = useInvestorsStore((s) => s.loans)
    const repayments = useInvestorsStore((s) => s.repayments)
    const { openModal: openInvestment } = useModal("investment-create")
    const { openModal: openLoan } = useModal("loan-create")
    const { openModal: openRepay } = useModal("loan-repay")
    const [repayLoan, setRepayLoan] = useState<LoanRow | null>(null)

    const row = useMemo(
        () => investorRows({ investors, investments, loans, repayments }).find((r) => r.id === id),
        [investors, investments, loans, repayments, id],
    )
    const ownInvestments = useMemo(
        () => investments.filter((i) => i.investor_id === id).sort((a, b) => b.date.localeCompare(a.date)),
        [investments, id],
    )
    const ownLoans = useMemo(
        () => loanRows(loans.filter((l) => l.investor_id === id), repayments).sort((a, b) => b.date.localeCompare(a.date)),
        [loans, repayments, id],
    )

    const investmentCols = useMemo<ColumnDef<Investment>[]>(
        () => [
            { accessorKey: "date", header: t("investors.fields.date"), cell: ({ row }) => d(row.original.date) },
            {
                accessorKey: "kind",
                header: t("investors.fields.kind"),
                cell: ({ row }) =>
                    row.original.kind === "vehicle" ?
                        <span>{t("investors.kind.vehicle")} · <span className="font-medium">{row.original.vehicle}</span></span>
                    :   t("investors.kind.cash"),
            },
            { accessorKey: "amount", header: t("investors.fields.amount"), cell: ({ row }) => <span className="tabular-nums">{usd(row.original.amount)}</span> },
            { accessorKey: "comment", header: t("investors.fields.comment"), cell: ({ row }) => row.original.comment || "—" },
        ],
        [t],
    )

    const loanCols = useMemo<ColumnDef<LoanRow>[]>(
        () => [
            { accessorKey: "date", header: t("investors.fields.loan_date"), cell: ({ row }) => d(row.original.date) },
            { accessorKey: "amount", header: t("investors.loans.amount"), cell: ({ row }) => <span className="tabular-nums">{usd(row.original.amount)}</span> },
            { accessorKey: "paid", header: t("investors.loans.paid"), cell: ({ row }) => <span className="tabular-nums">{row.original.paid ? usd(row.original.paid) : "—"}</span> },
            {
                accessorKey: "left",
                header: t("investors.loans.left"),
                cell: ({ row }) => <span className={cn("tabular-nums", row.original.left && "font-semibold")}>{row.original.left ? usd(row.original.left) : "—"}</span>,
            },
            { accessorKey: "due_date", header: t("investors.fields.due_date"), cell: ({ row }) => d(row.original.due_date) },
            {
                accessorKey: "status",
                header: t("investors.loans.status"),
                cell: ({ row }) => (
                    <Badge variant="outline" className={cn("font-medium", STATUS_STYLE[row.original.status])}>
                        {t(`investors.status.${row.original.status}`)}
                    </Badge>
                ),
            },
            { accessorKey: "comment", header: t("investors.fields.comment"), cell: ({ row }) => row.original.comment || "—" },
        ],
        [t],
    )

    if (!row) {
        return (
            <div className="flex flex-col items-start gap-3">
                <Button variant="ghost" onClick={() => navigate({ to: "/investor-royxati" })}>
                    <ArrowLeft className="w-4 h-4" />
                    {t("investors.title")}
                </Button>
                <p className="text-muted-foreground">{t("investors.not_found")}</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <Button variant="ghost" size="icon" aria-label={t("investors.title")} onClick={() => navigate({ to: "/investor-royxati" })}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold truncate">{row.name}</h1>
                        {row.phone && <p className="text-sm text-muted-foreground">{row.phone}</p>}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={openInvestment}>
                        <Plus className="w-4 h-4" />
                        {t("investors.actions.add_investment")}
                    </Button>
                    <Button variant="secondary" onClick={openLoan}>
                        <HandCoins className="w-4 h-4" />
                        {t("investors.actions.add_loan")}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <StatCard label={t("investors.list.invested")} value={usd(row.invested)} />
                <StatCard label={t("investors.list.share")} value={pct(row.share)} />
                <StatCard label={t("investors.list.loaned")} value={usd(row.loaned)} />
                <StatCard label={t("investors.list.loan_left")} value={usd(row.loan_left)} tone={row.loan_left ? "warn" : undefined} />
            </div>

            <Section title={t("investors.sections.investments")}>
                <DataTable columns={investmentCols} data={ownInvestments} numeration />
            </Section>

            <Section title={t("investors.sections.loans")}>
                <DataTable
                    columns={loanCols}
                    data={ownLoans}
                    numeration
                    rowAction={(l) =>
                        l.left > 0 ?
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setRepayLoan(l)
                                    openRepay()
                                }}
                            >
                                {t("investors.actions.repay")}
                            </Button>
                        :   null
                    }
                />
            </Section>

            <Modal title={t("investors.actions.add_investment")} modalKey="investment-create">
                <AddInvestmentForm investorId={id} />
            </Modal>
            <Modal title={t("investors.actions.add_loan")} modalKey="loan-create">
                <AddLoanForm investorId={id} />
            </Modal>
            <Modal title={t("investors.actions.repay_title")} modalKey="loan-repay">
                {repayLoan && <RepayLoanForm key={repayLoan.id} loan={repayLoan} />}
            </Modal>
        </div>
    )
}

export default InvestorDetail
