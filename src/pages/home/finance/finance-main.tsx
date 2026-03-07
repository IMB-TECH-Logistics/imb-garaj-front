import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { VEHICLES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { PlusCircle } from "lucide-react"
import ReportsFilter from "../truck-details/filter"
import { useCostCols } from "./cols"
import AddTransport from "./create"
import { excelData } from "../texnik-check/data"
const FinanceStatisticMain = () => {
    const search: any = useSearch({ strict: false })
    const navigate = useNavigate()
    const params = useParams({ strict: false })
    const { getData, setData, clearKey } = useGlobalStore()
    const { openModal: openCreateModal, closeModal: closeCreateModal } =
        useModal("create")
    const { openModal: openDeleteModal } = useModal("delete")
    const currentTrip = getData<TripRow>(VEHICLES)

    const { data: vehiclesData, isLoading } = useGet<ListResponse<Truck>>(
        VEHICLES,
        {
            params: {
                search: search,
                page: search.page,
                page_size: search.page_size,
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
        })
    }

    const columns = useCostCols()
    return (
        <div className="space-y-3">
            <DataTable
                columns={columns}
                loading={isLoading}
                data={excelData || []}
                numeration
                // onEdit={({ original }) => handleEdit(original)}
                // onDelete={handleDelete}
                // onRowClick={handleRowClick}
                head={
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <h1 className="text-xl">{`Transportlar ro'yxati`}</h1>
                        <div className="flex justify-between mb-3  gap-4">
                            <ReportsFilter />
                            <Button onClick={handleCreate}>
                                {" "}
                                <PlusCircle size={18} />
                                Qo'shish{" "}
                            </Button>
                        </div>
                    </div>
                }
                paginationProps={{
                    totalPages: vehiclesData?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
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
