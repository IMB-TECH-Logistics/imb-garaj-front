import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { OWNER_MAIN_STATISTIC, VEHICLES } from "@/constants/api-endpoints"
import { formatMoney } from "@/lib/format-money"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { ArrowDownCircle, ArrowUpCircle, PlusCircle, TrendingUp } from "lucide-react"
import { useMemo } from "react"
import ParamDateRange from "@/components/as-params/date-picker-range"
import { useCostCols, OwnerStatistic } from "./cols"
import AddTransport from "./create"

const FinanceStatisticMain = () => {
    const search: any = useSearch({ strict: false })
    const navigate = useNavigate()
    const params = useParams({ strict: false })
    const { getData, setData, clearKey } = useGlobalStore()
    const { openModal: openCreateModal, closeModal: closeCreateModal } =
        useModal("create")
    const { openModal: openDeleteModal } = useModal("delete")
    const currentTrip = getData<TripRow>(VEHICLES)

    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const defaultDateRange = (!search?.from_date && !search?.to_date) 
        ? { from: startOfMonth, to: endOfMonth } 
        : undefined;

    const { data: statisticsData, isLoading } = useGet<OwnerStatistic[]>(
        OWNER_MAIN_STATISTIC,
        {
            params: {
                search: search?.search,
                from_date: search?.from_date,
                to_date: search?.to_date,
            },
        },
    )

    const handleCreate = () => {
        clearKey(VEHICLES)
        openCreateModal()
    }

    const handleEdit = (item: any) => {
        setData(VEHICLES, item)
        openCreateModal()
    }

    const handleDelete = (row: { original: any }) => {
        setData(VEHICLES, row.original)
        openDeleteModal()
    }
    const handleRowClick = (item: any) => {
        const id = item?.id
        if (!id) return

        navigate({
            to: "/truck-detail/$id",
            params: { id: id.toString() },
            search: {
                from_date: search?.from_date,
                to_date: search?.to_date,
                truck_number: item.truck_number,
                truck_type_name: item.truck_type_name,
                order_count_busy: item.order_count_busy,
                order_count_empty: item.order_count_empty,
            } as any
        })
    }

    const totals = useMemo(() => {
        const data = statisticsData || []
        const round3 = (v: number) => Math.round(v * 1000) / 1000
        const totalIncome = data.reduce((sum, item) => sum + (Number(item.income ?? 0) || 0), 0)
        const totalExpense = data.reduce((sum, item) => sum + (Number(item.expense ?? 0) || 0), 0)
        const totalProfit = totalIncome - totalExpense
        return {
            totalIncome: round3(totalIncome),
            totalExpense: round3(totalExpense),
            totalProfit: round3(totalProfit),
        }
    }, [statisticsData])

    const columns = useCostCols()
    return (
        <div className="space-y-3">
            <DataTable
                columns={columns}
                loading={isLoading}
                data={statisticsData || []}
                numeration
                viewAll
                onRowClick={handleRowClick}
                // onEdit={({ original }) => handleEdit(original)}
                // onDelete={handleDelete}
                head={
                    <>
                        <div className="flex items-center justify-end gap-3 mb-3">
                            <div className="flex gap-4">
                                <ParamDateRange
                                    from="from_date"
                                    to="to_date"
                                    defaultValue={defaultDateRange}
                                    addButtonProps={{
                                        className: "!bg-background dark:!bg-secondary min-w-32 justify-start",
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            {/* Jami Xarajat */}
                            <Card className="relative overflow-hidden border-none shadow-none bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium opacity-80">
                                            Jami Xarajat
                                        </CardTitle>
                                        <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-2">
                                            <ArrowDownCircle className="h-4 w-4" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatMoney(totals.totalExpense)} so'm
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Daromad */}
                            <Card className="relative overflow-hidden border-none shadow-none bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium opacity-80">
                                            Daromad
                                        </CardTitle>
                                        <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-2">
                                            <ArrowUpCircle className="h-4 w-4" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatMoney(totals.totalIncome)} so'm
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Foyda */}
                            <Card className={`relative overflow-hidden border-none shadow-none ${
                                totals.totalProfit >= 0
                                    ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                                    : "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400"
                            }`}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium opacity-80">
                                            Foyda
                                        </CardTitle>
                                        <div className={`rounded-full p-2 ${
                                            totals.totalProfit >= 0
                                                ? "bg-blue-100 dark:bg-blue-900/50"
                                                : "bg-orange-100 dark:bg-orange-900/50"
                                        }`}>
                                            <TrendingUp className="h-4 w-4" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatMoney(totals.totalProfit)} so'm
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                }
            />

            <Modal
                modalKey="create"
                size="max-w-2xl"
                classNameTitle="font-medium text-xl"
                title={`Transport ${currentTrip?.id ? "tahrirlash" : "qo'shish"}`}
            >
                <div className="max-h-[80vh] overflow-y-auto p-0.5">
                    <AddTransport />
                </div>
            </Modal>
            <DeleteModal path={VEHICLES} id={currentTrip?.id} />
        </div>
    )
}

export default FinanceStatisticMain
