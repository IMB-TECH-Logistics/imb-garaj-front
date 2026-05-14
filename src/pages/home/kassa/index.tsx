import ParamDateRange from "@/components/as-params/date-picker-range"
import DownloadAsExcel from "@/components/download-as-excel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CHECKOUT_MAIN, DRIVERS_BALANCE } from "@/constants/api-endpoints"
const TRANSACTIONS = "transaction"
import { useGet } from "@/hooks/useGet"
import { useHasAction } from "@/constants/useUser"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { Plus, X } from "lucide-react"
import { useMemo } from "react"

type Transaction = {
    amount: string
    comment: string | null
    executor_name: string
    created: string
    type: number // 1 = Income, -1 = Outcome
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
                        {formatMoney(Number(row.original.amount))} so'm
                    </span>
                ),
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
    const search = useSearch({ strict: false }) as any
    const { data: checkout } = useGet<{ id: number; name: string; balance: string }>(CHECKOUT_MAIN)
    const { data: driversData } = useGet<DriverRow[]>(DRIVERS_BALANCE)
    const driverFilterId = search.driver ? Number(search.driver) : null
    const typeFilter: "all" | "1" | "-1" =
        search.type === "1" || search.type === "-1" ? search.type : "all"
    const filterParams = {
        page: search.page,
        page_size: search.page_size,
        from_date: search.from_date,
        to_date: search.to_date,
        driver: search.driver,
        type: typeFilter === "all" ? undefined : Number(typeFilter),
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

    return (
        <div className="flex md:flex-row flex-col w-full gap-3 md:items-start">
            {/* Left sidebar */}
            <div className="md:max-w-sm md:min-w-sm w-full md:sticky md:top-0 md:max-h-screen shrink-0">
                <Card className="bg-muted/60 md:max-h-screen flex flex-col">
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
                                >
                                    <Plus size={20} />
                                    Chiqim
                                </Button>
                                <Button type="button" className="w-full">
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
                                                {driver.balance} so'm
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
            <div className="w-full min-w-0 overflow-x-auto">
                <DataTable
                    numeration
                    loading={transactionsLoading}
                    columns={transactionCols}
                    data={transactionsData?.results}
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
        </div>
    )
}

export default Kassa
