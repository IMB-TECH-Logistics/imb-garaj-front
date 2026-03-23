import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { OWNER_MAIN_STATISTIC, VEHICLES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { PlusCircle } from "lucide-react"
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
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <h1 className="text-xl">Biznes Egasi Ma'lumotlari</h1>
                        <div className="flex justify-between mb-3  gap-4">
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
