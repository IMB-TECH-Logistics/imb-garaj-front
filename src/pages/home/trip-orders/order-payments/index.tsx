import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { TRIPS_ORDERS_PAYMENT } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useParams, useSearch } from "@tanstack/react-router"
import TableHeaderTripsOrders from "../trip-table-header"
import AddPayment from "./add-payments"
import { useColumnsOrderPayment } from "./payments-cols"
const TripDetailPayment = () => {
    const { getData, setData, clearKey } = useGlobalStore()
    const { openModal: openCreateModal } = useModal("create-order-payment")
    const { openModal: openDeleteModal } = useModal("delete-order-payment")

    const currentPayment = getData<OrderPaymentType>(TRIPS_ORDERS_PAYMENT)
    const search = useSearch({ strict: false })
    const params = useParams({ strict: false })
const { parentId, childId } = useParams({ strict: false })

const tripId = Number(parentId)
const orderId = Number(childId)

    const { data, isLoading } = useGet<ListResponse<OrderPaymentType>>(
        TRIPS_ORDERS_PAYMENT,
        {
            params: {
                order:orderId,
                page: 1,
                page_size: 1000,
            },
        },
    )

    const columns = useColumnsOrderPayment()

    const handleEdit = (item: OrderPaymentType) => {
        setData(TRIPS_ORDERS_PAYMENT, item)
        openCreateModal()
    }

    const handleDelete = (row: { original: OrderPaymentType }) => {
        setData(TRIPS_ORDERS_PAYMENT, row.original)
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
                    viewAll={true}
                    tableWrapperClassName="max-h-[400px] overflow-auto"
                    head={
                        <TableHeaderTripsOrders
                            modalKey="create-order-payment"
                            storeKey={TRIPS_ORDERS_PAYMENT}
                            heading="To'lovlar ro'yxati"
                        />
                    }
                />
            </div>

            <Modal
                modalKey="create-order-payment"
                size="max-w-2xl"
                classNameTitle="font-medium text-xl"
                title={`To'lov ${currentPayment?.id ? "tahrirlash" : "qo‘shish"
                    }`}
            >
                <div className="max-h-[80vh] overflow-y-auto p-0.5">
                    <AddPayment />
                </div>
            </Modal>

            <DeleteModal
                path={TRIPS_ORDERS_PAYMENT}
                id={currentPayment?.id}
                modalKey="delete-order-payment"
            />
        </div>
    )
}

export default TripDetailPayment
