import ParamDateRange from "@/components/as-params/date-picker-range"
import DownloadAsExcel from "@/components/download-as-excel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ParamCombobox } from "@/components/as-params/combobox"
import {
    CHECKOUT_BALANCES,
    CHECKOUT_LOGS,
    CHECKOUT_PENDING_COUNTS,
    CHECKOUT_SUMMARY,
    CHECKOUT_TRANSACTIONS,
    DRIVERS_BALANCE,
    TRANSACTIONS,
} from "@/constants/api-endpoints"
import DeleteModal from "@/components/custom/delete-modal"
import TableActions from "@/components/custom/table-actions"
import Modal from "@/components/custom/modal"
import CheckoutAdjustModal from "./adjust-modal"
import CheckoutTransferModal from "./transfer-modal"
import CheckoutRequestModal from "./request-modal"
import CheckoutLogs from "./logs"
import CheckoutRequests from "./requests"
import CheckoutReport from "./report"
import KassaSummary, { KASSA_SUMMARY_GROUPS, KassaSummaryData, KassaSummaryGroup } from "./summary"
import { useGet } from "@/hooks/useGet"
import { useHasAction } from "@/constants/useUser"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useModal } from "@/hooks/useModal"
import { ArrowLeftRight, Plus, Send, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

type Transaction = {
    id: number
    amount: string
    comment: string | null
    executor_name: string
    created: string
    type: number
    status: number
    checkout_kind: "cash" | "card"
    currency: number
    currency_course: string | null
    through: string | null
    driver_name: string | null
    vehicle_plate: string | null
    source: string | null
    is_unconfirmed?: boolean
    awaiting_order_completion?: boolean
}

type DriverRow = {
    id?: number
    full_name: string
    balance: string
}

type PendingCounts = {
    requests: number
    order_cashflows: number
}

const TX_STATUS_LABEL_KEY: Record<number, string> = {
    10: "kassa.status_pending",
    20: "kassa.status_approved",
    [-10]: "kassa.status_rejected",
    [-20]: "kassa.status_rollback",
}

const useTransactionCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<Transaction>[]>(
        () => [
            {
                header: t("form.amount"),
                accessorKey: "amount",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className={row.original.awaiting_order_completion ? "text-muted-foreground" : undefined}>
                        {formatMoney(
                            row.original.currency === 2 && row.original.currency_course
                                ? Number(row.original.amount) * Number(row.original.currency_course)
                                : Number(row.original.amount),
                        )}
                    </span>
                ),
            },
            {
                header: t("kassa.checkout_kind"),
                accessorKey: "checkout_kind",
                cell: ({ row }) =>
                    row.original.checkout_kind === "card" ?
                        t("kassa.card")
                    :   t("kassa.cash"),
            },
            {
                header: t("form.vehicle"),
                accessorKey: "vehicle_plate",
                cell: ({ row }) => row.original.vehicle_plate || "—",
            },
            {
                header: t("form.driver"),
                accessorKey: "driver_name",
                cell: ({ row }) => row.original.driver_name || "—",
            },
            {
                header: t("table.source"),
                accessorKey: "source",
                cell: ({ row }) => row.original.source || "—",
            },
            {
                header: t("table.responsible"),
                accessorKey: "executor_name",
                enableSorting: true,
            },
            {
                header: t("form.date"),
                accessorKey: "created",
                enableSorting: true,
                cell: ({ row }) => {
                    const d = new Date(row.original.created)
                    if (isNaN(d.getTime())) return "-"
                    return d.toLocaleString("uz-UZ", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                    })
                },
            },
            {
                header: t("form.comment"),
                accessorKey: "comment",
                enableSorting: true,
            },
            {
                header: t("table.type"),
                accessorKey: "type",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="flex flex-col gap-1">
                        <Badge
                            variant={
                                row.original.type === -1 ?
                                    "destructive"
                                :   "default"
                            }
                        >
                            {row.original.type === -1 ? t("form.expense") : t("form.income")}
                        </Badge>
                        {row.original.awaiting_order_completion && (
                            <Badge
                                variant="secondary"
                                className="bg-muted text-muted-foreground"
                                title={t("kassa.awaiting_order_hint")}
                            >
                                {t("kassa.awaiting_order")}
                            </Badge>
                        )}
                        {row.original.status !== 20 && !row.original.awaiting_order_completion && (
                            <Badge variant="orange">
                                {t(TX_STATUS_LABEL_KEY[row.original.status] ?? "kassa.status_pending")}
                            </Badge>
                        )}
                        {row.original.status === 20 && row.original.is_unconfirmed && (
                            <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 border-transparent"
                            >
                                Tasdiqlanmagan
                            </Badge>
                        )}
                    </div>
                ),
            },
        ],
        [t],
    )
}


const Kassa = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("manager_cashflow_control")
    const transactionCols = useTransactionCols()
    const navigate = useNavigate()
    const { openModal: openTopUp } = useModal("checkout-top-up")
    const { openModal: openExpense } = useModal("checkout-expense")
    const { openModal: openEdit } = useModal("checkout-edit")
    const { openModal: openDelete } = useModal("checkout-delete")
    const { openModal: openTransfer } = useModal("checkout-transfer")
    const { openModal: openRequest } = useModal("checkout-request-create")
    const [selected, setSelected] = useState<Transaction | null>(null)
    const search = useSearch({ strict: false }) as any
    const { data: pendingCounts } = useGet<PendingCounts>(CHECKOUT_PENDING_COUNTS)
    const { data: driversData } = useGet<DriverRow[]>(DRIVERS_BALANCE)
    const { data: vehiclesData } = useGet<{ id: number; name: string }[]>(
        "selectable/vehicle",
        { params: { model_name: "vehicle" } },
    )
    const vehicles = vehiclesData ?? []
    const driverFilterId = search.driver ? Number(search.driver) : null
    const typeFilter: "all" | "1" | "-1" =
        search.type === "1" || search.type === "-1" ? search.type : "all"
    const kindFilter: "all" | "cash" | "card" =
        search.tx_kind === "cash" || search.tx_kind === "card" ? search.tx_kind : "all"
    const groupFilter: KassaSummaryGroup | undefined =
        KASSA_SUMMARY_GROUPS.includes(search.group) ? search.group : undefined
    const driversRef = useRef<HTMLDivElement>(null)
    const [driversHighlight, setDriversHighlight] = useState(false)
    useEffect(() => {
        if (!driversHighlight) return
        const timer = setTimeout(() => setDriversHighlight(false), 1500)
        return () => clearTimeout(timer)
    }, [driversHighlight])
    const filterParams = {
        page: search.page,
        page_size: search.page_size,
        from_date: search.from_date,
        to_date: search.to_date,
        driver: search.driver,
        vehicle: search.vehicle,
        search: search.tx_search,
        type: typeFilter === "all" ? undefined : Number(typeFilter),
        checkout_kind: kindFilter === "all" ? undefined : kindFilter,
        group: groupFilter,
        ordering: search.ordering,
    }
    const { data: transactionsData, isLoading: transactionsLoading } = useGet<ListResponse<Transaction>>(
        TRANSACTIONS,
        { params: filterParams },
    )
    const drivers = useMemo(
        () =>
            [...(driversData ?? [])].sort(
                (a, b) =>
                    Number(b.balance || 0) - Number(a.balance || 0) ||
                    (a.full_name ?? "").localeCompare(b.full_name ?? ""),
            ),
        [driversData],
    )
    const selectedDriver = useMemo(
        () =>
            driverFilterId != null
                ? drivers.find((d) => d.id === driverFilterId)
                : null,
        [drivers, driverFilterId],
    )

    const driversTotal = useMemo(
        () =>
            drivers.reduce(
                (sum, d) => sum + Number(d.balance || 0),
                0,
            ),
        [drivers],
    )

    const handleDriverClick = (driver: DriverRow) => {
        if (!driver.id) return
        const next = driverFilterId === driver.id ? undefined : driver.id
        navigate({
            search: { ...search, driver: next, page: undefined } as any,
        })
    }

    const view: "transactions" | "logs" | "requests" | "report" =
        search.kassa_view === "logs" ? "logs"
        : search.kassa_view === "requests" ? "requests"
        : search.kassa_view === "report" ? "report"
        : "transactions"

    const handleViewChange = (val: string) => {
        navigate({
            search: {
                ...search,
                kassa_view: val === "transactions" ? undefined : val,
                page: undefined,
                ordering: undefined,
            } as any,
        })
    }

    const viewSwitcher = (
        <Tabs value={view} onValueChange={handleViewChange}>
            <TabsList className="h-9">
                <TabsTrigger value="transactions">
                    {t("page.transactions")}
                </TabsTrigger>
                <TabsTrigger value="requests">
                    {t("kassa.requests_tab")}
                </TabsTrigger>
                <TabsTrigger value="logs">
                    {t("kassa_log.title")}
                </TabsTrigger>
                <TabsTrigger value="report">
                    {t("kassa.report_tab")}
                </TabsTrigger>
            </TabsList>
        </Tabs>
    )

    const clearDriverFilter = () => {
        navigate({ search: { ...search, driver: undefined } as any })
    }

    const handleTypeChange = (val: string) => {
        navigate({
            search: {
                ...search,
                type: val === "all" ? undefined : val,
                page: undefined,
            } as any,
        })
    }

    const handleKindChange = (val: string) => {
        navigate({
            search: {
                ...search,
                tx_kind: val === "all" ? undefined : val,
                page: undefined,
            } as any,
        })
    }

    const handleSummaryGroup = (group: KassaSummaryGroup, data: KassaSummaryData) => {
        navigate({
            search: {
                ...search,
                kassa_view: undefined,
                group,
                from_date: data.from_date,
                to_date: data.to_date,
                tx_kind: undefined,
                type: undefined,
                page: undefined,
            } as any,
        })
    }

    const handleSummaryKind = (kind: "cash" | "card") => {
        navigate({
            search: {
                ...search,
                kassa_view: undefined,
                group: undefined,
                tx_kind: kind,
                page: undefined,
            } as any,
        })
    }

    const handleSummaryDrivers = () => {
        driversRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        setDriversHighlight(true)
    }

    const clearGroupFilter = () => {
        navigate({ search: { ...search, group: undefined, page: undefined } as any })
    }

    const goToRequests = () => {
        navigate({ search: { ...search, kassa_view: "requests" } as any })
    }

    return (
        <div className="flex md:flex-row flex-col w-full gap-3 md:h-[calc(100svh-7.5rem)] md:min-h-0 md:overflow-hidden">
            {/* Left sidebar */}
            <div className="md:max-w-sm md:min-w-sm w-full md:h-full shrink-0">
                <Card className="bg-muted/60 md:h-full flex flex-col overflow-hidden">
                    <CardHeader className="space-y-2 shrink-0 p-3">
                        <KassaSummary
                            activeGroup={view === "transactions" ? groupFilter : undefined}
                            activeKind={view === "transactions" && kindFilter !== "all" ? kindFilter : undefined}
                            onGroup={handleSummaryGroup}
                            onKind={handleSummaryKind}
                            onDrivers={handleSummaryDrivers}
                        />
                        {!!pendingCounts?.requests && (
                            <button type="button" onClick={goToRequests} className="w-fit">
                                <Badge variant="orange">
                                    {t("kassa.pending_requests", { count: pendingCounts.requests })}
                                </Badge>
                            </button>
                        )}
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3 flex-1 min-h-0 flex flex-col">
                        {hasControl && (
                            <div className="gap-2 flex items-center flex-wrap shrink-0">
                                <Button
                                    variant="destructive"
                                    type="button"
                                    className="flex-1 min-w-[45%]"
                                    onClick={openExpense}
                                >
                                    <Plus size={20} />
                                    {t("actions.add_expense_btn")}
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1 min-w-[45%]"
                                    onClick={openTopUp}
                                >
                                    <Plus size={20} />
                                    {t("page.top_up_balance")}
                                </Button>
                                <Button
                                    variant="secondary"
                                    type="button"
                                    className="flex-1 min-w-[45%]"
                                    onClick={openTransfer}
                                >
                                    <ArrowLeftRight size={18} />
                                    {t("kassa.transfer")}
                                </Button>
                                <Button
                                    variant="secondary"
                                    type="button"
                                    className="flex-1 min-w-[45%]"
                                    onClick={openRequest}
                                >
                                    <Send size={18} />
                                    {t("kassa.request")}
                                </Button>
                            </div>
                        )}

                        <div
                            ref={driversRef}
                            className={cn(
                                "border-t pt-3 shrink-0 rounded-md transition-colors",
                                driversHighlight && "bg-primary/10",
                            )}
                        >
                            <p className="text-sm text-muted-foreground">
                                {t("page.drivers_balance")}
                            </p>
                            <p className="text-xl font-semibold mt-0.5">
                                {formatMoney(driversTotal)} {t("page.som")}
                            </p>
                        </div>

                        <div className="border-t pt-3 flex-1 min-h-0 flex flex-col">
                            <p className="text-sm font-medium text-muted-foreground mb-2 shrink-0">
                                {t("page.details")}
                            </p>
                            <div className="space-y-1 flex-1 min-h-0 overflow-y-auto pr-1">
                                {drivers.map((driver, i) => {
                                    const isActive =
                                        driverFilterId === driver.id
                                    return (
                                        <div
                                            key={driver.id}
                                            onClick={() =>
                                                handleDriverClick(driver)
                                            }
                                            className={cn(
                                                "flex items-center justify-between py-1.5 px-2 rounded-md transition-colors cursor-pointer",
                                                isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "hover:bg-muted/80",
                                            )}
                                        >
                                            <span className="text-sm flex items-center gap-2 min-w-0">
                                                <span className="text-xs text-muted-foreground w-4 text-right">
                                                    {i + 1}
                                                </span>
                                                <span className="truncate">{driver.full_name}</span>
                                            </span>
                                            <span className="text-sm font-medium">
                                                {formatMoney(Number(driver.balance ?? 0))}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right table */}
            <div className="w-full min-w-0 md:h-full min-h-0">
                {view === "logs" ?
                    <CheckoutLogs switcher={viewSwitcher} />
                : view === "requests" ?
                    <CheckoutRequests switcher={viewSwitcher} />
                : view === "report" ?
                    <CheckoutReport switcher={viewSwitcher} />
                :   <DataTable
                    numeration
                    manualSorting
                    rowAction={
                        hasControl ?
                            (row: Transaction) =>
                                row.through === "checkout" || row.through === "transfer" ?
                                    <TableActions
                                        onEdit={() => {
                                            setSelected(row)
                                            openEdit()
                                        }}
                                        onDelete={() => {
                                            setSelected(row)
                                            openDelete()
                                        }}
                                    />
                                :   null
                        :   undefined
                    }
                    loading={transactionsLoading}
                    columns={transactionCols}
                    data={transactionsData?.results}
                    wrapperClassName="md:h-full flex flex-col"
                    tableWrapperClassName="flex-1 min-h-0 overflow-auto"
                    paginationProps={{
                        totalPages: transactionsData?.total_pages,
                        paramName: "page",
                        pageSizeParamName: "page_size",
                    }}
                    head={
                        <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                {viewSwitcher}
                                <Badge>
                                    {formatMoney(transactionsData?.count)}
                                </Badge>
                                {groupFilter && (
                                    <Badge
                                        variant="outline"
                                        className="gap-1 pr-1"
                                    >
                                        {t(`kassa.group_${groupFilter}`)}
                                        <button
                                            type="button"
                                            onClick={clearGroupFilter}
                                            className="ml-1 p-0.5 rounded hover:bg-muted"
                                            aria-label={t("page.clear_filters")}
                                        >
                                            <X size={12} />
                                        </button>
                                    </Badge>
                                )}
                                {selectedDriver && (
                                    <Badge
                                        variant="outline"
                                        className="gap-1 pr-1"
                                    >
                                        {t("form.driver")}: {selectedDriver.full_name}
                                        <button
                                            type="button"
                                            onClick={clearDriverFilter}
                                            className="ml-1 p-0.5 rounded hover:bg-muted"
                                            aria-label={t("page.clear_filters")}
                                        >
                                            <X size={12} />
                                        </button>
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <ParamCombobox
                                    paramName="vehicle"
                                    options={vehicles}
                                    label={t("form.vehicle")}
                                    addButtonProps={{
                                        className: "!bg-background dark:!bg-secondary min-w-40 justify-start",
                                    }}
                                />
                                <Tabs
                                    value={kindFilter}
                                    onValueChange={handleKindChange}
                                >
                                    <TabsList className="h-9">
                                        <TabsTrigger value="all">
                                            {t("status.all")}
                                        </TabsTrigger>
                                        <TabsTrigger value="cash">
                                            {t("kassa.cash")}
                                        </TabsTrigger>
                                        <TabsTrigger value="card">
                                            {t("kassa.card")}
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <Tabs
                                    value={typeFilter}
                                    onValueChange={handleTypeChange}
                                >
                                    <TabsList className="h-9">
                                        <TabsTrigger value="all">
                                            {t("status.all")}
                                        </TabsTrigger>
                                        <TabsTrigger value="1">
                                            {t("form.income")}
                                        </TabsTrigger>
                                        <TabsTrigger value="-1">
                                            {t("form.expense")}
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <ParamDateRange
                                    from="from_date"
                                    to="to_date"
                                />
                                <DownloadAsExcel
                                    url={`${TRANSACTIONS}/excel`}
                                    name="Kassa"
                                    params={filterParams}
                                />
                            </div>
                        </div>
                    }
                />}
            </div>

            <Modal
                modalKey="checkout-top-up"
                title={t("page.top_up_balance")}
                size="max-w-md"
            >
                <CheckoutAdjustModal
                    modalKey="checkout-top-up"
                    kind="income"
                />
            </Modal>
            <Modal
                modalKey="checkout-expense"
                title={t("page.add_expense")}
                size="max-w-md"
            >
                <CheckoutAdjustModal
                    modalKey="checkout-expense"
                    kind="expense"
                />
            </Modal>
            <Modal
                modalKey="checkout-edit"
                title={t("page.edit_record")}
                size="max-w-md"
            >
                <CheckoutAdjustModal
                    modalKey="checkout-edit"
                    kind={selected?.type === -1 ? "expense" : "income"}
                    editing={
                        selected ?
                            {
                                id: selected.id,
                                amount: selected.amount,
                                comment: selected.comment,
                                checkout_kind: selected.checkout_kind,
                            }
                        :   undefined
                    }
                />
            </Modal>
            <Modal
                modalKey="checkout-transfer"
                title={t("kassa.transfer_title")}
                size="max-w-md"
            >
                <CheckoutTransferModal modalKey="checkout-transfer" />
            </Modal>
            <Modal
                modalKey="checkout-request-create"
                title={t("kassa.request")}
                size="max-w-md"
            >
                <CheckoutRequestModal modalKey="checkout-request-create" />
            </Modal>
            <DeleteModal
                modalKey="checkout-delete"
                path={CHECKOUT_TRANSACTIONS}
                id={selected?.id}
                refetchKeys={[CHECKOUT_BALANCES, CHECKOUT_SUMMARY, TRANSACTIONS, CHECKOUT_LOGS]}
            />
        </div>
    )
}

export default Kassa
