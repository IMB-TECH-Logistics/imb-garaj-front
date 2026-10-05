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
import { ArrowDownCircle, ArrowUpCircle, TriangleAlert, TrendingUp, Wrench } from "lucide-react"
import { useMemo } from "react"
import ParamDateRange, { useDefaultRangeApplied } from "@/components/as-params/date-picker-range"
import { useCostCols, OwnerStatistic } from "./cols"
import { MonthlyReport, VehicleExpenses, useInvestors } from "./investor-report"
import { ParamCombobox } from "@/components/as-params/combobox"
import ParamTabs from "@/components/as-params/tabs"
import AddTransport from "./create"
import { useTranslation } from "react-i18next"

const FinanceStatisticMain = () => {
    const { t } = useTranslation()
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

    const isValidRange = (!search?.from_date && !search?.to_date) ||
        (!!search?.from_date && !!search?.to_date && new Date(search.from_date) <= new Date(search.to_date))

    const rangeReady = useDefaultRangeApplied()

    const { data: statisticsData, isLoading, isError } = useGet<OwnerStatistic[]>(
        OWNER_MAIN_STATISTIC,
        {
            params: {
                search: search?.search,
                from_date: search?.from_date,
                to_date: search?.to_date,
                owner: search?.owner,
            },
            enabled: isValidRange && rangeReady,
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
        const toNum = (v: string | number | null | undefined) => Number(v ?? 0) || 0
        const totalIncome = data.reduce((sum, item) => sum + toNum(item.income), 0)
        const totalExpense = data.reduce((sum, item) => sum + toNum(item.expense), 0)
        const totalVehicleExpense = data.reduce((sum, item) => sum + toNum(item.vehicle_expense), 0)
        const unpriced = data.reduce((sum, item) => sum + toNum(item.unpriced_count), 0)
        const totalProfit = totalIncome - totalExpense
        return {
            totalIncome: round3(totalIncome),
            totalExpense: round3(totalExpense),
            totalProfit: round3(totalProfit),
            totalVehicleExpense: round3(totalVehicleExpense),
            totalNet: round3(totalProfit - totalVehicleExpense),
            unpriced,
        }
    }, [statisticsData])

    const columns = useCostCols()
    const investors = useInvestors()

    const cards = [
        { title: "Daromad", value: totals.totalIncome, icon: ArrowUpCircle, tone: "green" },
        { title: "Reys xarajati", value: totals.totalExpense, icon: ArrowDownCircle, tone: "red" },
        { title: "Reys foydasi", value: totals.totalProfit, icon: TrendingUp, tone: totals.totalProfit >= 0 ? "blue" : "orange" },
        { title: "Mashina xarajati", value: totals.totalVehicleExpense, icon: Wrench, tone: "red" },
        { title: "Sof foyda", value: totals.totalNet, icon: TrendingUp, tone: totals.totalNet >= 0 ? "blue" : "orange" },
    ] as const

    const toneClass: Record<string, { card: string; icon: string }> = {
        green: { card: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400", icon: "bg-green-100 dark:bg-green-900/50" },
        red: { card: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400", icon: "bg-red-100 dark:bg-red-900/50" },
        blue: { card: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400", icon: "bg-blue-100 dark:bg-blue-900/50" },
        orange: { card: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400", icon: "bg-orange-100 dark:bg-orange-900/50" },
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-end gap-3 flex-wrap">
                {investors.length > 1 && (
                    <ParamCombobox
                        paramName="owner"
                        options={investors}
                        label="Investor"
                        labelKey="name"
                        valueKey="id"
                        addButtonProps={{
                            className: "!bg-background dark:!bg-secondary min-w-48 justify-start",
                        }}
                    />
                )}
                <ParamDateRange
                    from="from_date"
                    to="to_date"
                    defaultValue={defaultDateRange}
                    addButtonProps={{
                        className: "!bg-background dark:!bg-secondary min-w-32 justify-start",
                    }}
                />
            </div>

            {totals.unpriced > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-300">
                    <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                        <b>{totals.unpriced} ta reysga</b> buxgalter hali narx belgilamagan. Ularning xarajati hisobda bor, daromadi esa narx qo'yilgandan keyin qo'shiladi — natija hozircha to'liq emas.
                    </span>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {cards.map((c) => (
                    <Card key={c.title} className={`relative overflow-hidden border-none shadow-none ${toneClass[c.tone].card}`}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium opacity-80">{c.title}</CardTitle>
                                <div className={`rounded-full p-2 ${toneClass[c.tone].icon}`}>
                                    <c.icon className="h-4 w-4" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold tabular-nums">
                                {isError ? "—" : <>{formatMoney(c.value)} so'm</>}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <ParamTabs
                paramName="inv_tab"
                options={[
                    {
                        value: "vehicles",
                        label: "Mashinalar",
                        content: (
                            <DataTable
                                columns={columns}
                                loading={isLoading}
                                data={statisticsData || []}
                                numeration
                                viewAll
                                onRowClick={handleRowClick}
                            />
                        ),
                    },
                    { value: "monthly", label: "Oylar bo'yicha", content: <MonthlyReport /> },
                    { value: "expenses", label: "Mashina xarajatlari", content: <VehicleExpenses /> },
                ]}
            />

            <Modal
                modalKey="create"
                size="max-w-2xl"
                classNameTitle="font-medium text-xl"
                title={currentTrip?.id ? t("form.edit_vehicle") : t("form.add_vehicle")}
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
