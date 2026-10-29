import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { useModal } from "@/hooks/useModal"
import { AddContragentForm } from "@/pages/home/kontragent/forms"
import { Kontragent, num, som, usd, useKontragents } from "@/pages/home/kontragent/api"
import { useNavigate } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const INVESTOR_CREATE = "investor-create"

export const pct = (v: number) => `${v.toFixed(1).replace(".", ",").replace(/,0$/, "")}%`

export const StatCard = ({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "warn" }) => (
    <Card>
        <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={`text-2xl font-semibold tabular-nums ${tone === "warn" ? "text-amber-600" : ""}`}>{value}</span>
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </CardContent>
    </Card>
)

export const useInvestorRows = () => {
    const query = useKontragents("investor")
    const rows = useMemo(() => {
        const list = query.data ?? []
        const total = list.reduce((s, r) => s + num(r.invested_usd), 0)
        return list.map((r) => ({
            ...r,
            share: total ? (num(r.invested_usd) / total) * 100 : 0,
            loanLeft: Math.max(num(r.balance), 0),
        }))
    }, [query.data])
    return { ...query, rows }
}

type Row = Kontragent & { share: number; loanLeft: number }

const InvestorsPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { openModal } = useModal(INVESTOR_CREATE)
    const { rows, isLoading } = useInvestorRows()

    const totalInvested = rows.reduce((s, r) => s + num(r.invested_usd), 0)
    const totalLoanLeft = rows.reduce((s, r) => s + r.loanLeft, 0)
    const debtors = rows.filter((r) => r.loanLeft > 0).length
    const open = (id: number) => navigate({ to: "/investor-royxati/$id", params: { id: String(id) } })

    const columns = useMemo<ColumnDef<Row>[]>(
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
            { accessorKey: "invested_usd", header: t("investors.list.invested"), cell: ({ row }) => <span className="tabular-nums">{usd(row.original.invested_usd)}</span> },
            { accessorKey: "share", header: t("investors.list.share"), cell: ({ row }) => <span className="tabular-nums">{pct(row.original.share)}</span> },
            {
                accessorKey: "taken",
                header: t("investors.list.loaned"),
                cell: ({ row }) => <span className="tabular-nums">{num(row.original.taken) ? som(row.original.taken) : "—"}</span>,
            },
            {
                accessorKey: "loanLeft",
                header: t("investors.list.loan_left"),
                cell: ({ row }) => (
                    <span className={`tabular-nums ${row.original.loanLeft ? "font-medium text-amber-600" : ""}`}>
                        {row.original.loanLeft ? som(row.original.loanLeft) : "—"}
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
                    value={som(totalLoanLeft)}
                    sub={debtors ? t("investors.list.debt_to", { count: debtors }) : undefined}
                    tone={totalLoanLeft ? "warn" : undefined}
                />
            </div>

            <DataTable columns={columns} data={rows} loading={isLoading} numeration onRowClick={(r) => open(r.id)} />

            <Modal title={t("investors.actions.add_investor")} modalKey={INVESTOR_CREATE}>
                <AddContragentForm fixedType="investor" modalKey={INVESTOR_CREATE} onCreated={open} />
            </Modal>
        </div>
    )
}

export default InvestorsPage
