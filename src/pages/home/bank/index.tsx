import ParamDateRange from "@/components/as-params/date-picker-range"
import ParamTabs from "@/components/as-params/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { useHasAction } from "@/constants/useUser"
import { useModal } from "@/hooks/useModal"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowDownCircle, ArrowUpCircle, FileUp, Landmark, Minus, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import BankExpenseModal, { BANK_EXPENSE_MODAL } from "./expense-modal"
import BankImportModal, { BANK_IMPORT_MODAL } from "./import-modal"
import BankIncomeModal, { BANK_INCOME_MODAL } from "./income-modal"
import BankRequestsTab, { useBankRequests } from "./requests-tab"
import type { BankEditRow } from "./types"

export const BANK_OVERVIEW = "checkout/bank/overview"
export const BANK_TRANSACTIONS = "checkout/bank/transactions"
const BANK_DELETE_MODAL = "bank-delete"

type BankOverview = {
    balance: string
    opening_balance: string
    total_income: string
    total_expense: string
    closing_balance: string
}

type BankTransaction = BankEditRow & {
    source: string
    manual: boolean
    editable: boolean
    payment_type: string | null
    petrol_station: string | null
    vehicle: string | null
    executor: string | null
}

const StatCard = ({
    icon,
    tone,
    label,
    value,
    hint,
    valueClass,
}: {
    icon: React.ReactNode
    tone: string
    label: string
    value: React.ReactNode
    hint?: React.ReactNode
    valueClass?: string
}) => (
    <Card className="h-full">
        <CardContent className="p-4 h-full flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", tone)}>
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
                <div className={cn("text-xl font-semibold tabular-nums truncate", valueClass)}>{value}</div>
                {hint && <div className="text-xs text-muted-foreground tabular-nums truncate">{hint}</div>}
            </div>
        </CardContent>
    </Card>
)

const formatDateTime = (s?: string | null) => {
    if (!s) return "—"
    const d = new Date(s)
    return isNaN(d.getTime()) ? s : format(d, "dd/MM/yyyy HH:mm")
}

const useBankColumns = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<BankTransaction>[]>(
        () => [
            {
                accessorKey: "created",
                header: t("bank_page.date"),
                size: 120,
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.created)}</span>,
            },
            {
                accessorKey: "kind",
                header: t("bank_page.kind"),
                size: 80,
                cell: ({ row }) =>
                    row.original.kind === "kirim" ?
                        <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">{t("bank_page.income")}</Badge>
                    :   <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/10">{t("bank_page.expense")}</Badge>,
            },
            {
                accessorKey: "amount",
                header: t("bank_page.amount"),
                cell: ({ row }) => (
                    <span
                        className={cn(
                            "tabular-nums font-medium whitespace-nowrap",
                            row.original.kind === "kirim" ? "text-emerald-600" : "text-rose-600",
                        )}
                    >
                        {row.original.kind === "kirim" ? "+" : "−"}
                        {formatMoney(Number(row.original.amount))}
                    </span>
                ),
            },
            {
                accessorKey: "source",
                header: t("bank_page.source"),
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span>{row.original.source || "—"}</span>

                        {row.original.payment_type && (
                            <span className="text-xs text-muted-foreground">{row.original.payment_type}</span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "vehicle",
                header: t("bank_page.vehicle"),
                cell: ({ row }) => <span className="whitespace-nowrap">{row.original.vehicle || "—"}</span>,
            },
            {
                accessorKey: "petrol_station",
                header: t("bank_page.station"),
                cell: ({ row }) => row.original.petrol_station || "—",
            },
            {
                accessorKey: "comment",
                header: t("bank_page.comment"),
                meta: { className: "min-w-[360px] w-[40%]" },
                cell: ({ row }) => (
                    <span className="block whitespace-normal break-words text-sm">{row.original.comment || "—"}</span>
                ),
            },
            {
                accessorKey: "executor",
                header: t("bank_page.executor"),
                cell: ({ row }) => row.original.executor || "—",
            },
        ],
        [t],
    )
}

const BankPage = () => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as Record<string, any>
    const kind = search.bank_kind === "kirim" || search.bank_kind === "chiqim" ? search.bank_kind : undefined
    const onRequests = search.bank_kind === "requests"
    const { data: requests } = useBankRequests()
    const pendingCount = requests?.count ?? 0
    const period = { from_date: search.from_date, to_date: search.to_date }
    const hasPeriod = !!(search.from_date || search.to_date)

    const { data: overview } = useGet<BankOverview>(BANK_OVERVIEW, { params: period })
    const { data, isLoading } = useGet<ListResponse<BankTransaction>>(BANK_TRANSACTIONS, {
        params: {
            ...period,
            kind,
            search: search.bank_search,
            page: search.page,
            page_size: search.page_size,
        },
    })
    const columns = useBankColumns()
    const canAdd = useHasAction("kassa_cashier_control")
    const { openModal: openIncome } = useModal(BANK_INCOME_MODAL)
    const { openModal: openImport } = useModal(BANK_IMPORT_MODAL)
    const { openModal: openExpense } = useModal(BANK_EXPENSE_MODAL)
    const { openModal: openDelete } = useModal(BANK_DELETE_MODAL)
    const [edit, setEdit] = useState<BankTransaction | null>(null)
    const startEdit = (row: BankTransaction) => {
        if (!row.editable) return
        setEdit(row)
        if (row.kind === "kirim") openIncome()
        else openExpense()
    }
    const startDelete = (row: BankTransaction) => {
        if (!row.editable) return
        setEdit(row)
        openDelete()
    }
    const addNew = (open: () => void) => () => {
        setEdit(null)
        open()
    }
    const balance = Number(overview?.balance ?? 0)

    return (
        <>
            <h1 className="sr-only">{t("bank_page.title")}</h1>
            <ParamTabs
                paramName="bank_kind"
                right={
                    <div className="flex items-center gap-2">
                        <ParamDateRange from="from_date" to="to_date" />
                        {canAdd && (
                            <Button variant="outline" onClick={addNew(openImport)} className="shrink-0">
                                <FileUp size={16} className="mr-1" />
                                {t("bank_page.import.button")}
                            </Button>
                        )}
                        {canAdd && (
                            <Button variant="destructive" onClick={addNew(openExpense)} className="shrink-0">
                                <Minus size={16} className="mr-1" />
                                {t("bank_page.add_expense")}
                            </Button>
                        )}
                        {canAdd && (
                            <Button onClick={addNew(openIncome)} className="shrink-0">
                                <Plus size={16} className="mr-1" />
                                {t("bank_page.add_income")}
                            </Button>
                        )}
                    </div>
                }
                options={[
                    { value: "all", label: t("bank_page.all") },
                    { value: "kirim", label: t("bank_page.income") },
                    { value: "chiqim", label: t("bank_page.expense") },
                    {
                        value: "requests",
                        label: (
                            <span className="inline-flex items-center gap-1.5">
                                {t("bank_page.req.tab")}
                                {pendingCount > 0 && (
                                    <Badge className="h-5 min-w-5 px-1.5 bg-amber-500 text-white hover:bg-amber-500">{pendingCount}</Badge>
                                )}
                            </span>
                        ),
                    },
                ]}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                <StatCard
                    icon={<ArrowDownCircle size={20} />}
                    tone="bg-emerald-500/10 text-emerald-600"
                    label={t("bank_page.income")}
                    value={formatMoney(Number(overview?.total_income ?? 0))}
                    valueClass="text-emerald-600"
                />
                <StatCard
                    icon={<ArrowUpCircle size={20} />}
                    tone="bg-rose-500/10 text-rose-600"
                    label={t("bank_page.expense")}
                    value={formatMoney(Number(overview?.total_expense ?? 0))}
                    valueClass="text-rose-600"
                />
                <StatCard
                    icon={<Landmark size={20} />}
                    tone="bg-primary/10 text-primary"
                    label={t("bank_page.balance")}
                    value={formatMoney(balance)}
                    hint={
                        hasPeriod ?
                            `${t("bank_page.opening")}: ${formatMoney(Number(overview?.opening_balance ?? 0))} · ${t("bank_page.closing")}: ${formatMoney(Number(overview?.closing_balance ?? 0))}`
                        :   undefined
                    }
                    valueClass={cn(balance < 0 && "text-rose-600", balance > 0 && "text-emerald-600")}
                />
            </div>
            {onRequests ?
                <BankRequestsTab />
            :   <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                numeration
                onEdit={canAdd ? ({ original }) => startEdit(original) : undefined}
                onDelete={canAdd ? ({ original }) => startDelete(original) : undefined}
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
            />
            }
            <Modal title={t("bank_page.import.title")} modalKey={BANK_IMPORT_MODAL} size="max-w-6xl">
                <BankImportModal refetchKeys={[BANK_OVERVIEW, BANK_TRANSACTIONS]} />
            </Modal>
            <Modal title={edit ? t("bank_page.edit_expense") : t("bank_page.add_expense")} modalKey={BANK_EXPENSE_MODAL} size="max-w-lg">
                <BankExpenseModal refetchKeys={[BANK_OVERVIEW, BANK_TRANSACTIONS]} edit={edit} />
            </Modal>
            <Modal title={edit ? t("bank_page.edit_income") : t("bank_page.add_income")} modalKey={BANK_INCOME_MODAL} size="max-w-lg">
                <BankIncomeModal refetchKeys={[BANK_OVERVIEW, BANK_TRANSACTIONS]} edit={edit} />
            </Modal>
            <DeleteModal
                modalKey={BANK_DELETE_MODAL}
                path={BANK_TRANSACTIONS}
                id={edit?.id}
                name={edit ? `${formatMoney(Number(edit.amount))} · ${edit.source || ""}` : ""}
                disableRefetch
                refetchKeys={[BANK_OVERVIEW, BANK_TRANSACTIONS]}
            />
        </>
    )
}

export default BankPage
