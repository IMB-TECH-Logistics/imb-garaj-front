import ParamDateRange from "@/components/as-params/date-picker-range"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import TableActions from "@/components/custom/table-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select2"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/format-money"
import EmptyBox from "@/components/custom/empty-box"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { useState } from "react"
import {
    DollarSign,
    ArrowLeft,
    ArrowUpCircle,
    Fuel,
    MapPin,
    Plus,
    Wallet,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import AddExpenseModal from "./add-expense-modal"
import {
    formatQuantity,
    type StationCashFlowRow,
    useStationCashFlowColumns,
} from "./cashflow-cols"
import { type PetrolStationRow } from "./cols"
import EditCashFlowModal, {
    useEditCashFlowStore,
} from "./edit-cashflow-modal"
import TopUpModal from "./top-up-modal"

type StationStats = {
    balance: number
    total_top_ups: number
    total_outcomes: number
    total_liters: number
    total_gas: number
    top_up_count: number
    expense_count: number
}

const CASH_FLOW_DELETE_KEY = "petrol-cash-flow-delete"

const TABS: { key: string; labelKey: string; action: number | null }[] = [
    { key: "all", labelKey: "status.all", action: null },
    { key: "topups", labelKey: "settings.expenses.flow_income", action: 1 },
    { key: "expenses", labelKey: "settings.petrol.expense", action: -1 },
]

const PetrolStationDetail = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { id } = useParams({ strict: false }) as { id: string }
    const stationId = Number(id)
    const search = useSearch({ strict: false }) as Record<string, any>
    const activeTab = (search.tab as string) ?? "all"
    const activeAction =
        TABS.find((t) => t.key === activeTab)?.action ?? null

    const hasControl = useHasAction("settings_petrol_stations_control")

    const { data: station, error: stationError } = useGet<PetrolStationRow>(
        `${SETTINGS_PETROL_STATIONS}/${stationId}`,
        { enabled: !!stationId, options: { retry: false } },
    )

    const { data: stats } = useGet<StationStats>(
        `${SETTINGS_PETROL_STATIONS}/${stationId}/stats`,
        {
            params: {
                from_date: search.from_date,
                to_date: search.to_date,
            },
            enabled: !!station,
        },
    )

    const { data: cashflows, isLoading } = useGet<
        ListResponse<StationCashFlowRow>
    >(`${SETTINGS_PETROL_STATIONS}/${stationId}/cash-flows`, {
        params: {
            search: search.cashflow_search,
            page: search.page,
            page_size: search.page_size,
            action: activeAction,
            from_date: search.from_date,
            to_date: search.to_date,
        },
        enabled: !!station,
    })

    const { openModal: openTopUp } = useModal("petrol-top-up")
    const { openModal: openExpense } = useModal("petrol-expense")
    const editCashFlow = useEditCashFlowStore()
    const { openModal: openDeleteCashFlow } = useModal(CASH_FLOW_DELETE_KEY)
    const [deletingCashFlow, setDeletingCashFlow] =
        useState<StationCashFlowRow | null>(null)

    const refetchAll = () => {
        queryClient.refetchQueries({
            predicate: (q) => String(q.queryKey[0]).includes("petrol-stations"),
        })
    }

    const columns = useStationCashFlowColumns()


    const handleEditCashFlow = (row: StationCashFlowRow) => {
        editCashFlow.open(row)
    }

    const handleDeleteCashFlow = (row: StationCashFlowRow) => {
        setDeletingCashFlow(row)
        openDeleteCashFlow()
    }

    const setTab = (key: string) => {
        navigate({
            search: (prev: any) => ({ ...prev, tab: key, page: 1 }),
        } as any)
    }

    const notFound = !stationId || stationError?.response?.status === 404
    if (notFound) {
        return (
            <div className="space-y-4 pb-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate({ to: "/petrol-stations" })}
                >
                    <ArrowLeft size={18} />
                    {t("settings.petrol.back_to_list")}
                </Button>
                <h1 className="text-xl font-semibold">{t("page.petrol_not_found")}</h1>
                <EmptyBox height="h-[50vh]" />
            </div>
        )
    }

    return (
        <div className="space-y-4 pb-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            navigate({ to: "/petrol-stations" })
                        }
                        className="shrink-0"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold leading-tight">
                            {station?.name ?? t("settings.petrol.station")}
                        </h1>
                        {station?.address && (
                            <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5 mt-0.5">
                                <MapPin size={12} />
                                {station.address}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
                    <div className="w-64 shrink-0">
                        <ParamDateRange from="from_date" to="to_date" />
                    </div>
                    <Select value={activeTab} onValueChange={setTab}>
                        <SelectTrigger className="w-36 !bg-background dark:!bg-secondary">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TABS.map((tab) => (
                                <SelectItem key={tab.key} value={tab.key}>
                                    {t(tab.labelKey)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {hasControl && (
                        <div className="flex items-center gap-2">
                            <Button onClick={openExpense} className="gap-1.5">
                                <Plus size={16} />
                                {t("settings.petrol.expense")}
                            </Button>
                            <Button onClick={openTopUp} className="gap-1.5">
                                <Plus size={16} />
                                {t("settings.petrol.prepayment")}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Card className="h-full">
                    <CardContent className="p-4 h-full flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                            <Fuel size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                {t("settings.petrol.fuel_received")}
                            </div>
                            <div className="text-xl font-semibold tabular-nums truncate text-amber-600">
                                {formatQuantity(Number(stats?.total_liters ?? 0), "liter")}
                                {" · "}
                                {formatQuantity(Number(stats?.total_gas ?? 0), "m3")}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="h-full">
                    <CardContent className="p-4 h-full flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                            <DollarSign size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                {t("form.amount_total")}
                            </div>
                            <div className="text-xl font-semibold tabular-nums truncate text-amber-600">
                                {formatMoney(
                                    Number(stats?.total_outcomes ?? 0),
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="h-full">
                    <CardContent className="p-4 h-full flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Wallet size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                {t("settings.petrol.station_balance")}
                            </div>
                            <div
                                className={cn(
                                    "text-xl font-semibold tabular-nums truncate",
                                    Number(stats?.balance ?? 0) < 0 && "text-rose-600",
                                    Number(stats?.balance ?? 0) > 0 && "text-emerald-600",
                                )}
                            >
                                {formatMoney(Number(stats?.balance ?? 0))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>


            <DataTable
                columns={columns}
                data={cashflows?.results ?? []}
                loading={isLoading}
                numeration
                rowAction={
                    hasControl ?
                        (row: StationCashFlowRow) => (
                            <TableActions
                                onEdit={() =>
                                    handleEditCashFlow(row)
                                }
                                onDelete={() =>
                                    handleDeleteCashFlow(row)
                                }
                            />
                        )
                    :   undefined
                }
                paginationProps={{
                    totalPages: cashflows?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                    page_sizes: [25, 50, 100, 250],
                }}
            />

            <Modal
                title={t("settings.petrol.prepayment")}
                modalKey="petrol-top-up"
                size="max-w-md"
            >
                <TopUpModal stationId={stationId} />
            </Modal>
            <Modal
                title={t("settings.petrol.expense")}
                modalKey="petrol-expense"
                size="max-w-md"
            >
                <AddExpenseModal stationId={stationId} />
            </Modal>
            <Modal
                title={
                    editCashFlow.get()?.action === -1
                        ? t("settings.petrol.edit_expense")
                        : t("settings.petrol.edit_prepayment")
                }
                modalKey="petrol-cash-flow-edit"
                size="max-w-md"
            >
                <EditCashFlowModal />
            </Modal>
            <DeleteModal
                path={`${SETTINGS_PETROL_STATIONS}/cash-flows`}
                id={
                    deletingCashFlow ? `${deletingCashFlow.id}/delete` : undefined
                }
                modalKey={CASH_FLOW_DELETE_KEY}
                onSuccessAction={refetchAll}
                disableRefetch
            />
        </div>
    )
}

export default PetrolStationDetail