import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { OWNER_MAIN_STATISTIC, VEHICLES } from "@/constants/api-endpoints"
import { formatSom } from "@/lib/money-format"
import { queryErrorHint, queryErrorMessage } from "@/lib/query-state"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { ArrowDownCircle, ArrowUpCircle, CalendarClock, TrendingUp } from "lucide-react"
import { useMemo } from "react"
import ParamDateRange from "@/components/as-params/date-picker-range"
import { shiftFullMonth } from "../oy-oraligi"
import { tableError } from "../pul-holat"
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

    const statsQ = useGet<OwnerStatistic[]>(
        OWNER_MAIN_STATISTIC,
        {
            params: {
                search: search?.search,
                from_date: search?.from_date,
                to_date: search?.to_date,
            },
        },
    )
    const { data: statisticsData, isLoading, isError, error } = statsQ
    /**
     * R3: raqam FAQAT so'rov muvaffaqiyatli tugaganda chiziladi. Server
     * umuman javob bermasa `isError` yonmaydi (so'rov "pending/idle" da
     * qotib qoladi) — o'shanda ham "0 so'm" ko'rsatilmasligi shart.
     */
    const statsOk = statsQ.isSuccess

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
        // IN-01/IN-02: kartadagi jami "Tushum" va "Foyda" ustunlari bilan AYNAN bir xil
        // ifodadan hisoblanadi (cols.tsx: income_with_vat || income), aks holda karta
        // hech qachon ustunlar yig'indisiga teng bo'lmaydi.
        const rowIncome = (item: (typeof data)[number]) =>
            toNum(item.income_with_vat) || toNum(item.income)
        const totalIncome = data.reduce((sum, item) => sum + rowIncome(item), 0)
        const totalExpense = data.reduce((sum, item) => sum + toNum(item.expense), 0)
        const totalProfit = totalIncome - totalExpense
        return {
            totalIncome: round3(totalIncome),
            totalExpense: round3(totalExpense),
            totalProfit: round3(totalProfit),
        }
    }, [statisticsData])

    const columns = useCostCols()

    // R3: banner FAQAT muvaffaqiyatli javobda (yuqoridagi izohga qarang).
    const emptyForRange =
        statsOk &&
        (statisticsData?.length ?? 0) > 0 &&
        (statisticsData || []).every(
            (item) =>
                !item.order_count_busy &&
                !item.order_count_empty &&
                !Number(item.income_with_vat ?? 0) &&
                !Number(item.income ?? 0),
        ) &&
        Boolean(search?.from_date || search?.to_date)

    /**
     * YANGI-06-TRUCK: ilgari `to_date` bir oy orqaga SILJITILARDI va oy kuni
     * saqlanib qolardi — 30-sentyabr 30-avgustga aylanib, 31-avgust
     * oralig'dan tushib qolardi. O'lchangan zarar: 3 250 000 so'm daromad va
     * 1 reys ekrandan yashirinardi (496 202 210.80 o'rniga 499 452 210.80
     * bo'lishi kerak). Endi to'liq oy oralig'i olinadi.
     */
    const goPreviousMonth = () => {
        const range = shiftFullMonth(search?.from_date, search?.to_date, -1)
        navigate({
            search: {
                ...search,
                ...range,
            } as any,
        })
    }

    return (
        <div className="space-y-3">
            {emptyForRange && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
                    <CalendarClock className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                        Tanlangan sana oralig'ida ({search?.from_date ?? "…"} —{" "}
                        {search?.to_date ?? "…"}) birorta reys yo'q, shuning uchun
                        Daromad 0 ko'rinadi. Bu mashinalar ishlamayapti degani emas —
                        sana oralig'ini kengaytiring.
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={goPreviousMonth}
                        className="ml-auto"
                    >
                        Oldingi oyni ko'rish
                    </Button>
                </div>
            )}

            {/* YANGI-04: so'rov yiqilganda (403 ham) kartalar "0 so'm" ko'rsatmasin —
                nol daromad bilan "ma'lumot berilmadi" bir xil narsa emas. */}
            {isError && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
                    <p className="font-medium text-amber-600 dark:text-amber-500">
                        {queryErrorMessage(error)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {queryErrorHint(error)}
                    </p>
                </div>
            )}

            <DataTable
                columns={columns}
                loading={isLoading}
                error={tableError(statsQ)}
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
                                        {statsOk ?
                                            `${formatSom(totals.totalExpense)} so'm`
                                        : isLoading ? "…"
                                        :   queryErrorMessage(error)}
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
                                        {statsOk ?
                                            `${formatSom(totals.totalIncome)} so'm`
                                        : isLoading ? "…"
                                        :   queryErrorMessage(error)}
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
                                        {statsOk ?
                                            `${formatSom(totals.totalProfit)} so'm`
                                        : isLoading ? "…"
                                        :   queryErrorMessage(error)}
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
