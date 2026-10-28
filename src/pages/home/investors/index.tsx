import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { useModal } from "@/hooks/useModal"
import { useNavigate } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { AddInvestorForm } from "./forms"
import { InvestorRow, investorRows, pct, useInvestorsStore, usd } from "./store"

export const StatCard = ({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "warn" }) => (
    <Card>
        <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={`text-2xl font-semibold tabular-nums ${tone === "warn" ? "text-amber-600" : ""}`}>{value}</span>
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </CardContent>
    </Card>
)

const InvestorsPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { openModal } = useModal("investor-create")
    const investors = useInvestorsStore((s) => s.investors)
    const investments = useInvestorsStore((s) => s.investments)
    const loanTxs = useInvestorsStore((s) => s.loanTxs)

    const rows = useMemo(
        () => investorRows({ investors, investments, loanTxs }),
        [investors, investments, loanTxs],
    )
    const totalInvested = rows.reduce((s, r) => s + r.invested, 0)
    const totalLoanLeft = rows.reduce((s, r) => s + r.loan_left, 0)
    const debtors = rows.filter((r) => r.loan_left > 0).length

    const open = (id: number) => navigate({ to: "/investor-royxati/$id", params: { id: String(id) } })

    const columns = useMemo<ColumnDef<InvestorRow>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("investors.fields.name"),
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{row.original.name}</span>
                        {row.original.phone && <span className="text-xs text-muted-foreground">{row.original.phone}</span>}
                    </div>
                ),
            },
            {
                accessorKey: "invested",
                header: t("investors.list.invested"),
                cell: ({ row }) => <span className="tabular-nums">{usd(row.original.invested)}</span>,
            },
            {
                accessorKey: "share",
                header: t("investors.list.share"),
                cell: ({ row }) => <span className="tabular-nums">{pct(row.original.share)}</span>,
            },
            {
                accessorKey: "loaned",
                header: t("investors.list.loaned"),
                cell: ({ row }) => <span className="tabular-nums">{row.original.loaned ? usd(row.original.loaned) : "—"}</span>,
            },
            {
                accessorKey: "loan_left",
                header: t("investors.list.loan_left"),
                cell: ({ row }) => (
                    <span className={`tabular-nums ${row.original.loan_left ? "font-medium text-amber-600" : ""}`}>
                        {row.original.loan_left ? usd(row.original.loan_left) : "—"}
                    </span>
                ),
            },
        ],
        [t],
    )

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-semibold">{t("investors.title")}</h1>
                <Button onClick={openModal}>
                    <Plus className="w-4 h-4" />
                    {t("investors.actions.add_investor")}
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard label={t("investors.list.count")} value={String(rows.length)} />
                <StatCard label={t("investors.list.total_invested")} value={usd(totalInvested)} />
                <StatCard
                    label={t("investors.list.total_loan_left")}
                    value={usd(totalLoanLeft)}
                    sub={debtors ? t("investors.list.debt_to", { count: debtors }) : undefined}
                    tone={totalLoanLeft ? "warn" : undefined}
                />
            </div>

            <DataTable columns={columns} data={rows} numeration onRowClick={(r) => open(r.id)} />

            <Modal title={t("investors.actions.add_investor")} modalKey="investor-create">
                <AddInvestorForm onCreated={open} />
            </Modal>
        </div>
    )
}

export default InvestorsPage
