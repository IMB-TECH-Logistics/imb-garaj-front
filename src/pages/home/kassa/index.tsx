import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { CHECKOUT_MAIN, DRIVERS_BALANCE } from "@/constants/api-endpoints"
const TRANSACTIONS = "transaction"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { Plus } from "lucide-react"
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
    const transactionCols = useTransactionCols()
    const navigate = useNavigate()
    const search = useSearch({ strict: false }) as any
    const { data: checkout } = useGet<{ id: number; name: string; balance: string }>(CHECKOUT_MAIN)
    const { data: driversData } = useGet<DriverRow[]>(DRIVERS_BALANCE)
    const { data: transactionsData, isLoading: transactionsLoading } = useGet<ListResponse<Transaction>>(
        TRANSACTIONS,
        { params: { page: search.page, page_size: search.page_size } },
    )
    const drivers = driversData ?? []

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
        navigate({
            to: "/manager-trips/$id",
            params: { id: driver.id.toString() },
            search: {
                driver_id: driver.id,
                name: driver.full_name,
            } as any,
        })
    }

    return (
        <div className="flex md:flex-row flex-col w-full gap-3 md:items-start">
            {/* Left sidebar */}
            <div className="md:max-w-sm md:min-w-sm w-full md:sticky md:top-0 shrink-0">
                <Card className="bg-muted/60">
                    <CardHeader className="space-y-0">
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
                    <CardContent className="pt-0 space-y-3">
                        <div className="gap-3 flex items-center justify-between">
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

                        <div className="border-t pt-3">
                            <p className="text-sm text-muted-foreground">
                                Haydovchilar balansi
                            </p>
                            <p className="text-xl font-semibold mt-0.5">
                                {formatMoney(driversTotal)} so'm
                            </p>
                        </div>

                        <div className="border-t pt-3">
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                                Batafsil
                            </p>
                            <div className="space-y-1">
                                {drivers.map((driver, i) => (
                                    <div
                                        key={driver.id}
                                        onClick={() => handleDriverClick(driver)}
                                        className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/80 transition-colors cursor-pointer"
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
                                ))}
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
                        <div className="flex justify-between items-center gap-3 mb-3">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg">Kiritilgan summa</h1>
                                <Badge>{formatMoney(transactionsData?.count)}</Badge>
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    )
}

export default Kassa
