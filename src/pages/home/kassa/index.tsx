import { useDefaultRangeApplied } from "@/components/as-params/date-picker-range"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CHECKOUT_PENDING_COUNTS, DRIVERS_BALANCE, TRANSACTIONS } from "@/constants/api-endpoints"
import TableActions from "@/components/custom/table-actions"
import CheckoutLogs from "./logs"
import CheckoutRequests from "./requests"
import CheckoutReport from "./report"
import { KASSA_SUMMARY_GROUPS, KassaSummaryData, KassaSummaryGroup } from "./summary"
import { useGet } from "@/hooks/useGet"
import { useHasAction } from "@/constants/useUser"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useModal } from "@/hooks/useModal"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Transaction, useTransactionCols } from "./transaction-cols"
import { DriverRow, PendingCounts, KassaSidebar } from "./kassa-sidebar"
import { TransactionsHead } from "./transactions-head"
import { KassaModals } from "./kassa-modals"

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
    const rangeReady = useDefaultRangeApplied()
    const { data: transactionsData, isLoading: transactionsLoading } = useGet<ListResponse<Transaction>>(
        TRANSACTIONS,
        { params: filterParams, enabled: rangeReady },
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
                <KassaSidebar view={view} groupFilter={groupFilter} kindFilter={kindFilter} pendingCounts={pendingCounts} hasControl={hasControl} handleSummaryGroup={handleSummaryGroup} handleSummaryKind={handleSummaryKind} handleSummaryDrivers={handleSummaryDrivers} goToRequests={goToRequests} openExpense={openExpense} openTopUp={openTopUp} openTransfer={openTransfer} openRequest={openRequest} driversRef={driversRef} driversHighlight={driversHighlight} driversTotal={driversTotal} drivers={drivers} driverFilterId={driverFilterId} handleDriverClick={handleDriverClick} />
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
                        <TransactionsHead viewSwitcher={viewSwitcher} transactionsData={transactionsData} groupFilter={groupFilter} clearGroupFilter={clearGroupFilter} selectedDriver={selectedDriver} clearDriverFilter={clearDriverFilter} vehicles={vehicles} kindFilter={kindFilter} handleKindChange={handleKindChange} typeFilter={typeFilter} handleTypeChange={handleTypeChange} filterParams={filterParams} />
                    }
                />}
            </div>

            <KassaModals selected={selected} />
        </div>
    )
}

export default Kassa
