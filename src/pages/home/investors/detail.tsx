import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { AddInvestmentForm, LoanTxFormView } from "./forms"
import { StatCard } from "./index"
import { Investment, LoanTxRow, investorRows, loanLedger, pct, useInvestorsStore, usd } from "./store"

const d = (v: string | null) => (v ? format(new Date(v), "dd.MM.yyyy") : "—")

const InvestorDetail = ({ id }: { id: number }) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const investors = useInvestorsStore((s) => s.investors)
    const investments = useInvestorsStore((s) => s.investments)
    const loanTxs = useInvestorsStore((s) => s.loanTxs)
    const { openModal: openInvestment } = useModal("investment-create")
    const { openModal: openLoanIn } = useModal("loan-in")
    const { openModal: openLoanOut } = useModal("loan-out")
    const [tab, setTab] = useState<"investments" | "loans">("investments")

    const row = useMemo(
        () => investorRows({ investors, investments, loanTxs }).find((r) => r.id === id),
        [investors, investments, loanTxs, id],
    )
    const ownInvestments = useMemo(
        () => investments.filter((i) => i.investor_id === id).sort((a, b) => b.date.localeCompare(a.date)),
        [investments, id],
    )
    const ledger = useMemo(() => loanLedger(loanTxs.filter((tx) => tx.investor_id === id)), [loanTxs, id])

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

    const loanCols = useMemo<ColumnDef<LoanTxRow>[]>(
        () => [
            { accessorKey: "date", header: t("investors.fields.date"), cell: ({ row }) => d(row.original.date) },
            {
                accessorKey: "dir",
                header: t("investors.fields.kind"),
                cell: ({ row }) => (
                    <Badge
                        variant="outline"
                        className={cn(
                            "font-medium",
                            row.original.dir === "in" ?
                                "bg-amber-500/10 text-amber-600 border-amber-500/30"
                            :   "bg-green-500/10 text-green-600 border-green-500/30",
                        )}
                    >
                        {t(row.original.dir === "in" ? "investors.loan_tx.in" : "investors.loan_tx.out")}
                    </Badge>
                ),
            },
            {
                accessorKey: "amount",
                header: t("investors.fields.amount"),
                cell: ({ row }) => (
                    <span className={cn("tabular-nums font-medium", row.original.dir === "in" ? "text-amber-600" : "text-green-600")}>
                        {row.original.dir === "in" ? "+" : "−"} {usd(row.original.amount)}
                    </span>
                ),
            },
            {
                accessorKey: "balance",
                header: t("investors.loan_tx.balance"),
                cell: ({ row }) => <span className="tabular-nums font-semibold">{usd(row.original.balance)}</span>,
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <StatCard label={t("investors.list.invested")} value={usd(row.invested)} />
                <StatCard label={t("investors.list.share")} value={pct(row.share)} />
                <StatCard label={t("investors.list.loaned")} value={usd(row.loaned)} sub={t("investors.loan_tx.repaid_sub", { amount: usd(row.repaid) })} />
                <StatCard label={t("investors.list.loan_left")} value={usd(row.loan_left)} tone={row.loan_left ? "warn" : undefined} />
            </div>

            <Card>
                <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                            <TabsList>
                                <TabsTrigger value="investments">
                                    {t("investors.sections.investments")} ({ownInvestments.length})
                                </TabsTrigger>
                                <TabsTrigger value="loans">
                                    {t("investors.sections.loans")} ({ledger.length})
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {tab === "investments" ?
                            <Button onClick={openInvestment}>
                                <Plus className="w-4 h-4" />
                                {t("investors.actions.add_investment")}
                            </Button>
                        :   <div className="flex flex-wrap gap-2">
                                <Button onClick={openLoanIn}>
                                    <ArrowDownLeft className="w-4 h-4" />
                                    {t("investors.actions.add_loan")}
                                </Button>
                                <Button variant="outline" onClick={openLoanOut} disabled={row.loan_left <= 0}>
                                    <ArrowUpRight className="w-4 h-4" />
                                    {t("investors.actions.repay")}
                                </Button>
                            </div>
                        }
                    </div>
                    {tab === "investments" ?
                        <DataTable columns={investmentCols} data={ownInvestments} numeration wrapperClassName="p-0" />
                    :   <DataTable columns={loanCols} data={ledger} numeration wrapperClassName="p-0" />}
                </CardContent>
            </Card>

            <Modal title={t("investors.actions.add_investment")} modalKey="investment-create">
                <AddInvestmentForm investorId={id} />
            </Modal>
            <Modal title={t("investors.actions.add_loan")} modalKey="loan-in">
                <LoanTxFormView investorId={id} dir="in" balance={row.loan_left} />
            </Modal>
            <Modal title={t("investors.actions.repay_title")} modalKey="loan-out">
                <LoanTxFormView investorId={id} dir="out" balance={row.loan_left} />
            </Modal>
        </div>
    )
}

export default InvestorDetail
