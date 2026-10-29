import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { Investment, kontragentUrl, num, som, usd } from "@/pages/home/kontragent/api"
import { CashForm } from "@/pages/home/kontragent/forms"
import { LedgerTable, useLedger } from "@/pages/home/kontragent/ledger-table"
import { useNavigate } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { AddInvestmentForm, INVESTMENT_CREATE } from "./forms"
import { StatCard, pct, useInvestorRows } from "./index"

const LOAN_IN = "investor-loan-in"
const LOAN_OUT = "investor-loan-out"

const InvestorDetail = ({ id }: { id: number }) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { rows, isLoading } = useInvestorRows()
    const row = rows.find((r) => r.id === id)
    const { data: investments = [], isLoading: invLoading } = useGet<Investment[]>(kontragentUrl(id, "investments"))
    const { data: ledger, isLoading: ledgerLoading } = useLedger(id)
    const { openModal: openInvestment } = useModal(INVESTMENT_CREATE)
    const { openModal: openLoanIn } = useModal(LOAN_IN)
    const { openModal: openLoanOut } = useModal(LOAN_OUT)
    const [tab, setTab] = useState<"investments" | "loans">("investments")
    const loans = (ledger ?? []).filter((r) => r.kind === "cash")

    const investmentCols = useMemo<ColumnDef<Investment>[]>(
        () => [
            { accessorKey: "date", header: t("investors.fields.date"), cell: ({ row }) => format(new Date(row.original.date), "dd.MM.yyyy") },
            {
                accessorKey: "kind",
                header: t("investors.fields.kind"),
                cell: ({ row }) =>
                    row.original.kind === "vehicle" ?
                        <span>{t("investors.kind.vehicle")} · <span className="font-medium">{row.original.vehicle_name}</span></span>
                    :   t("investors.kind.cash"),
            },
            { accessorKey: "amount_usd", header: t("investors.fields.amount"), cell: ({ row }) => <span className="tabular-nums">{usd(row.original.amount_usd)}</span> },
            {
                accessorKey: "amount_uzs",
                header: t("investors.fields.to_kassa"),
                cell: ({ row }) =>
                    row.original.amount_uzs ?
                        <div className="flex flex-col">
                            <span className="tabular-nums">{som(row.original.amount_uzs)}</span>
                            <span className="text-xs text-muted-foreground">{t("investors.rate_short", { rate: num(row.original.rate).toLocaleString("ru") })}</span>
                        </div>
                    :   "—",
            },
            { accessorKey: "comment", header: t("investors.fields.comment"), cell: ({ row }) => row.original.comment || "—" },
        ],
        [t],
    )

    const back = () => navigate({ to: "/investor-royxati" })

    if (!row) {
        return (
            <div className="flex flex-col items-start gap-3">
                <Button variant="ghost" onClick={back}>
                    <ArrowLeft className="w-4 h-4" />
                    {t("investors.title")}
                </Button>
                {!isLoading && <p className="text-muted-foreground">{t("investors.not_found")}</p>}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 min-w-0">
                <Button variant="ghost" size="icon" aria-label={t("investors.title")} onClick={back}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="min-w-0">
                    <h1 className="text-xl font-semibold truncate">{row.name}</h1>
                    {row.phone && <p className="text-sm text-muted-foreground">{row.phone}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <StatCard label={t("investors.list.invested")} value={usd(row.invested_usd)} />
                <StatCard label={t("investors.list.share")} value={pct(row.share)} />
                <StatCard label={t("investors.list.loaned")} value={som(row.taken)} sub={t("investors.loan_tx.repaid_sub", { amount: som(row.given) })} />
                <StatCard label={t("investors.list.loan_left")} value={som(row.loanLeft)} tone={row.loanLeft ? "warn" : undefined} />
            </div>

            <Card>
                <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                            <TabsList>
                                <TabsTrigger value="investments">{t("investors.sections.investments")} ({investments.length})</TabsTrigger>
                                <TabsTrigger value="loans">{t("investors.sections.loans")} ({loans.length})</TabsTrigger>
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
                                <Button variant="outline" onClick={openLoanOut} disabled={row.loanLeft <= 0}>
                                    <ArrowUpRight className="w-4 h-4" />
                                    {t("investors.actions.repay")}
                                </Button>
                            </div>
                        }
                    </div>
                    {tab === "investments" ?
                        <DataTable columns={investmentCols} data={investments} loading={invLoading} numeration wrapperClassName="p-0" />
                    :   <LedgerTable rows={loans} loading={ledgerLoading} />}
                </CardContent>
            </Card>

            <Modal title={t("investors.actions.add_investment")} modalKey={INVESTMENT_CREATE}>
                <AddInvestmentForm investorId={id} />
            </Modal>
            <Modal title={t("investors.actions.add_loan")} modalKey={LOAN_IN}>
                <CashForm contragentId={id} dir="in" modalKey={LOAN_IN} />
            </Modal>
            <Modal title={t("investors.actions.repay_title")} modalKey={LOAN_OUT}>
                <CashForm key={row.loanLeft} contragentId={id} dir="out" max={row.loanLeft} modalKey={LOAN_OUT} />
            </Modal>
        </div>
    )
}

export default InvestorDetail
