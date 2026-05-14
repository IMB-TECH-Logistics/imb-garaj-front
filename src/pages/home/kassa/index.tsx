import ParamDateRange from "@/components/as-params/date-picker-range"
import DownloadAsExcel from "@/components/download-as-excel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ParamInput from "@/components/as-params/input"
import { ParamCombobox } from "@/components/as-params/combobox"
import { CHECKOUT_MAIN, DRIVERS_BALANCE, TRANSACTIONS } from "@/constants/api-endpoints"
import Modal from "@/components/custom/modal"
import CheckoutAdjustModal from "./adjust-modal"
import { useGet } from "@/hooks/useGet"
import { useHasAction } from "@/constants/useUser"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useModal } from "@/hooks/useModal"
import { Plus, X } from "lucide-react"
import { useMemo } from "react"

type Transaction = {
    id: number
    amount: string
    comment: string | null
    executor_name: string
    created: string
    type: number
    currency: number
    currency_course: string | null
    through: string | null
    driver_name: string | null
    vehicle_plate: string | null
    source: string | null
}

type DriverRow = {
    id?: number
    full_name: string
    balance: string
}

const useTransactionCols = () => {
    return useMemo<ColumnDef<Transaction>[]>(
        () => [
            {
                header: "Summa",
                accessorKey: "amount",
                enableSorting: true,
                cell: ({ row }) => (
                    <span>
                        {formatMoney(Number(row.original.amount))}{" "}
                        {row.original.currency === 2 ? "USD" : "so'm"}
                    </span>
                ),
            },
            {
                header: "Avtomobil",
                accessorKey: "vehicle_plate",
                cell: ({ row }) => row.original.vehicle_plate || "—",
            },
            {
                header: "Haydovchi",
                accessorKey: "driver_name",
                cell: ({ row }) => row.original.driver_name || "—",
            },
            {
                header: "Manba",
                accessorKey: "source",
                cell: ({ row }) => row.original.source || "—",
            },
            {
                header: "Ma'sul",
                accessorKey: "executor_name",
                enableSorting: true,
            },
            {
                header: "Sana",
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
                header: "Izoh",
                accessorKey: "comment",
                enableSorting: true,
            },
            {
                header: "Turi",
                accessorKey: "type",
                enableSorting: true,
                cell: ({ row }) => (
                    <Badge
                        variant={
                            row.original.type === -1
                                ? "destructive"
                                : "default"
                        }
                    >
                        {row.original.type === -1 ? "Chiqim" : "Tushum"}
                    </Badge>
                ),
            },
        ],
        [],
    )
}


const Kassa = () => {
    const hasControl = useHasAction("manager_cashflow_control")
    const transactionCols = useTransactionCols()
    const navigate = useNavigate()
    const { openModal: openTopUp } = useModal("checkout-top-up")
    const { openModal: openExpense } = useModal("checkout-expense")
    const search = useSearch({ strict: false }) as any
    const { data: checkout } = useGet<{ id: number; name: string; balance: string }>(CHECKOUT_MAIN)
    const { data: driversData } = useGet<DriverRow[]>(DRIVERS_BALANCE)
    const { data: vehiclesData } = useGet<{ id: number; name: string }[]>(
        "selectable/vehicle",
        { params: { model_name: "vehicle" } },
    )
    const vehicles = vehiclesData ?? []
    const driverFilterId = search.driver ? Number(search.driver) : null
    const typeFilter: "all" | "1" | "-1" =
        search.type === "1" || search.type === "-1" ? search.type : "all"
    const currencyFilter: "all" | "1" | "2" =
        search.currency === "1" || search.currency === "2" ? search.currency : "all"
    const filterParams = {
        page: search.page,
        page_size: search.page_size,
        from_date: search.from_date,
        to_date: search.to_date,
        driver: search.driver,
        vehicle: search.vehicle,
        search: search.tx_search,
        type: typeFilter === "all" ? undefined : Number(typeFilter),
        currency: currencyFilter === "all" ? undefined : Number(currencyFilter),
    }
    const { data: transactionsData, isLoading: transactionsLoading } = useGet<ListResponse<Transaction>>(
        TRANSACTIONS,
        { params: filterParams },
    )
    const drivers = driversData ?? []
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

    const handleCurrencyChange = (val: string) => {
        navigate({
            search: {
                ...search,
                currency: val === "all" ? undefined : val,
                page: undefined,
            } as any,
        })
    }

    return (
        <div className="flex md:flex-row flex-col w-full gap-3 md:h-[calc(100svh-7.5rem)] md:min-h-0 md:overflow-hidden">
            {/* Left sidebar */}
            <div className="md:max-w-sm md:min-w-sm w-full md:h-full shrink-0">
                <Card className="bg-muted/60 md:h-full flex flex-col overflow-hidden">
                    <CardHeader className="space-y-0 shrink-0">
                        <CardTitle className="font-medium text-lg">
                            Asosiy Balans
                        </CardTitle>
                        <span>
                            <span className="text-xl font-semibold">
                                {formatMoney(Number(checkout?.balance ?? 0))}
                            </span>{" "}
                            <span className="text-base">so'm</span>
                        </span>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3 flex-1 min-h-0 flex flex-col">
                        {hasControl && (
                            <div className="gap-3 flex items-center justify-between shrink-0">
                                <Button
                                    variant="destructive"
                                    type="button"
                                    className="w-full"
                                    onClick={openExpense}
                                >
                                    <Plus size={20} />
                                    Chiqim
                                </Button>
                                <Button
                                    type="button"
                                    className="w-full"
                                    onClick={openTopUp}
                                >
                                    <Plus size={20} />
                                    Balans To'ldirish
                                </Button>
                            </div>
                        )}

                        <div className="border-t pt-3 shrink-0">
                            <p className="text-sm text-muted-foreground">
                                Haydovchilar balansi
                            </p>
                            <p className="text-xl font-semibold mt-0.5">
                                {formatMoney(driversTotal)} so'm
                            </p>
                        </div>

                        <div className="border-t pt-3 flex-1 min-h-0 flex flex-col">
                            <p className="text-sm font-medium text-muted-foreground mb-2 shrink-0">
                                Batafsil
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
                                            <span className="text-sm flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground w-4 text-right">
                                                    {i + 1}
                                                </span>
                                                {driver.full_name}
                                            </span>
                                            <span className="text-sm font-medium">
                                                {formatMoney(Number(driver.balance ?? 0))} so'm
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
                <DataTable
                    numeration
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
                                <h1 className="text-lg">Kiritilgan summa</h1>
                                <Badge>
                                    {formatMoney(transactionsData?.count)}
                                </Badge>
                                {selectedDriver && (
                                    <Badge
                                        variant="outline"
                                        className="gap-1 pr-1"
                                    >
                                        Haydovchi: {selectedDriver.full_name}
                                        <button
                                            type="button"
                                            onClick={clearDriverFilter}
                                            className="ml-1 p-0.5 rounded hover:bg-muted"
                                            aria-label="Filterni tozalash"
                                        >
                                            <X size={12} />
                                        </button>
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <ParamInput
                                    searchKey="tx_search"
                                    placeholder="Izoh / ma'sul..."
                                    className="!bg-background dark:!bg-secondary min-w-44"
                                />
                                <ParamCombobox
                                    paramName="vehicle"
                                    options={vehicles}
                                    label="Avtomobil"
                                    addButtonProps={{
                                        className: "!bg-background dark:!bg-secondary min-w-40 justify-start",
                                    }}
                                />
                                <Tabs
                                    value={currencyFilter}
                                    onValueChange={handleCurrencyChange}
                                >
                                    <TabsList className="h-9">
                                        <TabsTrigger value="all">
                                            UZS+USD
                                        </TabsTrigger>
                                        <TabsTrigger value="1">UZS</TabsTrigger>
                                        <TabsTrigger value="2">USD</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <Tabs
                                    value={typeFilter}
                                    onValueChange={handleTypeChange}
                                >
                                    <TabsList className="h-9">
                                        <TabsTrigger value="all">
                                            Hammasi
                                        </TabsTrigger>
                                        <TabsTrigger value="1">
                                            Tushum
                                        </TabsTrigger>
                                        <TabsTrigger value="-1">
                                            Chiqim
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
                />
            </div>

            <Modal
                modalKey="checkout-top-up"
                title="Balans to'ldirish"
                size="max-w-md"
            >
                <CheckoutAdjustModal
                    modalKey="checkout-top-up"
                    kind="income"
                />
            </Modal>
            <Modal
                modalKey="checkout-expense"
                title="Chiqim qo'shish"
                size="max-w-md"
            >
                <CheckoutAdjustModal
                    modalKey="checkout-expense"
                    kind="expense"
                />
            </Modal>
        </div>
    )
}

export default Kassa
