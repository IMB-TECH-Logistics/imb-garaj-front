import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { ORDER_CASHFLOWS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useParams, useSearch } from "@tanstack/react-router"
import TableHeaderTripsOrders from "../trip-table-header"
import AddCashflow from "./add-cashflow"
import { useCostCols } from "./cols"

const TripOrderDetailRow = () => {
    const { getData, setData, clearKey } = useGlobalStore()
    const { openModal: openCreateModal } = useModal("create-order-cashflow")
    const { openModal: openDeleteModal } = useModal("delete-order-cashflow")

    const currentCashflow = getData<CashflowRow>(ORDER_CASHFLOWS)
    const search = useSearch({ strict: false })
    const { parentId, childId } = useParams({ strict: false })

    const orderId = Number(childId)
    const { data, isLoading } = useGet<ListResponse<CashflowRow>>(
        ORDER_CASHFLOWS,
        {
            params: {
                order: orderId,
                page: 1,
                page_size: 1000,
            },
        },
    )

    const columns = useCostCols()

    const handleCreate = () => {
        clearKey(ORDER_CASHFLOWS)
        openCreateModal()
    }

    const handleEdit = (item: CashflowRow) => {
        setData(ORDER_CASHFLOWS, item)
        openCreateModal()
    }

    const handleDelete = (row: { original: CashflowRow }) => {
        setData(ORDER_CASHFLOWS, row.original)
        openDeleteModal()
    }

    return (
        <div>
            <div className="overflow-x-auto">
                <DataTable
                    loading={isLoading}
                    columns={columns}
                    data={data?.results}
                    numeration
                    onEdit={({ original }) => handleEdit(original)}
                    onDelete={handleDelete}
                    paginationProps={{
                        totalPages: 1,
                    }}
                    head={
                        <TableHeaderTripsOrders
                            modalKey="create-order-cashflow"
                            storeKey={ORDER_CASHFLOWS}
                            heading="Xarajatlar ro'yxati"
                        />
                    }
                />
            </div>

            <Modal
                modalKey="create-order-cashflow"
                size="max-w-2xl"
                classNameTitle="font-medium text-xl"
                title={`Xarajat ${currentCashflow?.id ? "tahrirlash" : "qo‘shish"
                    }`}
            >
                <div className="max-h-[80vh] overflow-y-auto p-0.5">
                    <AddCashflow />
                </div>
            </Modal>

            <DeleteModal
                path={ORDER_CASHFLOWS}
                id={currentCashflow?.id}
                modalKey="delete-order-cashflow"
            />
        </div>
    )
}

export default TripOrderDetailRow
