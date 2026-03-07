import ParamInput from "@/components/as-params/input"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { CASHFLOW_STATISTICS, TRIPS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { CirclePlus, TrendingDown, CreditCard } from "lucide-react"
import { useCostCols } from "./cols"
import AddTrip from "./create"
import { formatMoney } from "@/lib/format-money"

const ShiftStatisticMain = () => {
    const search = useSearch({ strict: false })
    const navigate = useNavigate()
    const { getData, setData, clearKey } = useGlobalStore()
    const { openModal: openCreateModal } = useModal("create")
    const { openModal: openDeleteModal } = useModal("delete")

    const currentTrip = getData<TripRow>(TRIPS)

    const { data, isLoading } = useGet<ListResponse<TripRow>>(TRIPS, {
        params: {
            search: search.driver_name,
            page: search.page,
            page_size: search.page_size,
        },
    })
    const { data: cashflowData } = useGet<any>(CASHFLOW_STATISTICS, {
        params: {
            page: search.page,
            page_size: search.page_size,
        },
    })

    const columns = useCostCols()

    const handleCreate = () => {
        clearKey(TRIPS)
        openCreateModal()
    }

    const handleEdit = (item: TripRow) => {
        setData(TRIPS, item)
        openCreateModal()
    }

    const handleDelete = (row: { original: any }) => {
        setData(TRIPS, row.original)
        openDeleteModal()
    }

    const handleRowClick = (item: TripRow) => {
        const id = item?.id
        if (!id) return

        navigate({
            to: "/trip/$parentId",
            params: { parentId: id.toString() },
        })
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 mb-2">
                <div
                    className="relative rounded-xl p-5 overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #3d1a0a 0%, #5c2a10 100%)" }}
                >
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                        <TrendingDown size={72} className="text-orange-300" />
                    </div>

                    <div className="flex items-start justify-between relative z-10">
                                             <span className="text-orange-200 text-sm font-medium">Jami Xarajatlar</span>
                        <div className="w-8 h-8 rounded-full bg-orange-700/60 flex items-center justify-center">
                            <TrendingDown size={16} className="text-orange-300" />
                        </div>
                    </div>
                    <div className="mt-4 relative z-10">
                        <span className="text-orange-400 text-2xl font-bold">
                            {formatMoney(cashflowData?.total_cashflow)}
                        </span>
                    </div>
                </div>

                <div
                    className="relative rounded-xl p-5 overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #0f1a3d 0%, #1a2a5c 100%)" }}
                >
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                        <CreditCard size={72} className="text-blue-300" />
                    </div>

                    <div className="flex items-start justify-between relative z-10">
                        <span className="text-blue-200 text-sm font-medium">Hisob Balansi</span>
                        <div className="w-8 h-8 rounded-full bg-blue-700/60 flex items-center justify-center">
                            <CreditCard size={16} className="text-blue-300" />
                        </div>
                    </div>
                    <div className="mt-4 relative z-10">
                        <span className="text-blue-300 text-2xl font-bold">
                             <span className="text-orange-400 text-2xl font-bold">
                            {formatMoney(cashflowData?.checkout_balance)}
                        </span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-3 gap-4">
                <ParamInput
                    name="driver_name"
                    fullWidth
                    searchKey="driver_name"
                />

                <Button
                    className="flex items-center gap-2"
                    onClick={handleCreate}
                >
                    <CirclePlus size={18} />
                    Qo'shish
                </Button>
            </div>

            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                numeration
                onEdit={({ original }) => handleEdit(original)}
                onDelete={handleDelete}
                onRowClick={handleRowClick}
                head={
                    <div className="flex items-center gap-3 mb-3">
                        <h1 className="text-xl">Aylanmalar ro'yxati</h1>
                    </div>
                }
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
            />

            <Modal
                modalKey="create"
                size="max-w-2xl"
                classNameTitle="font-medium text-xl"
                title={`Reys ${currentTrip?.id ? "tahrirlash" : "qo'shish"}`}
            >
                <div className="max-h-[80vh] overflow-y-auto p-0.5">
                    <AddTrip />
                </div>
            </Modal>

            <DeleteModal path={TRIPS} id={currentTrip?.id} />
        </div>
    )
}

export default ShiftStatisticMain