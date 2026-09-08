import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { TRIPS_ORDERS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { ArrowLeft, CirclePlus } from "lucide-react"
import AddTripOrders from "./create"
import { DataTable } from "@/components/ui/datatable"
import { useTripOrdersCols } from "./new-cols"
import AddExpenses from "./create/expense"
import OrderExpenses from "./cashfow/order-expenses"

const TripOrderMain = () => {
    const params = useParams({ strict: false })
    // 2-raund (RBAC): `trips/orders/*` ham `manager_flights` kodlari bilan himoyalangan.
    const hasControl = useHasAction("manager_flights_control")
    const search = useSearch({ strict: false })
    const page = Number(search.page ?? 1)
    const { getData, setData, clearKey } = useGlobalStore()
    const { openModal: openCreateModal } = useModal("create")
    const { openModal: AddExpenseModal } = useModal("add-expenses")

    const { openModal: openDeleteModal } = useModal("delete")
    const navigate = useNavigate()

    const parentId = params.parentId
    const currentTripsOrder = getData<TripsOrders>(TRIPS_ORDERS)

    const { data, isLoading, isError, error } = useGet<
        ListResponse<TripOrdersRow>
    >(
        TRIPS_ORDERS,
        {
            params: {
                trip: parentId,
                page,
            },
        },
    )

    const handleCreate = () => {
        clearKey(TRIPS_ORDERS)
        openCreateModal()
    }

    const handleEdit = (order: TripOrdersRow) => {
        setData(TRIPS_ORDERS, order)
        openCreateModal()
    }

    const handleDelete = (order: TripOrdersRow) => {
        setData(TRIPS_ORDERS, order)
        openDeleteModal()
    }

    /**
     * F5-06: `/trip/$parentId/$childId` sahifasi ishlaydi, lekin ilova ichidan
     * unga borish yo'li yo'q edi — navigatsiya izohga olingan bo'lib, sahifaga
     * faqat qo'lda URL yozib kirish mumkin edi. Qayta yoqildi.
     * (Amal tugmalari `stopPropagation` qiladi, shuning uchun ko'z/tahrirlash
     * bosilganda qo'shimcha o'tish sodir bo'lmaydi.)
     */
    const handleRowClick = (order: TripOrdersRow) => {
        const childId = order.id
        const parentId = params.parentId

        if (!childId || !parentId) return

        navigate({
            to: "/trip/$parentId/$childId",
            params: {
                parentId: parentId.toString(),
                childId: childId.toString(),
            },
        })
    }

    const handleAdd = (order: TripOrdersRow) => {
        setData(TRIPS_ORDERS, order)
        AddExpenseModal()
    }

    const handleToBack = () => {
        window.history.back()
    }

    const columns = useTripOrdersCols()


    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={handleToBack}
                >
                    <Button>
                        <ArrowLeft size={16} />
                    </Button>
                    <h1 className="font-bold">Reyslar ro‘yxati</h1>
                </div>
                {hasControl && (
                    <div className="flex justify-end">
                        <Button onClick={handleCreate} disabled={isError}>
                            <CirclePlus size={18} />
                            Qo'shish
                        </Button>
                    </div>
                )}
            </div>

            <div className="bg-card rounded-md p-3">
                <DataTable
                    loading={isLoading}
                    error={error}
                    columns={columns}
                    data={data?.results}
                    numeration
                    onEdit={hasControl ? ({ original }) => handleEdit(original) : undefined}
                    onDelete={hasControl ? ({ original }) => handleDelete(original) : undefined}
                    paginationProps={{
                        totalPages: 1,
                    }}
                    onRowClick={handleRowClick}
                    onView={({ original }) => handleAdd(original)}
                />
            </div>

            <Modal
                modalKey="create"
                size="max-w-2xl"
                title={`Buyurtma ${currentTripsOrder?.id ? "tahrirlash" : "qo‘shish"
                    }`}
            >
                <AddTripOrders />
            </Modal>

            <DeleteModal path={TRIPS_ORDERS} id={currentTripsOrder?.id} />
            <Modal
                modalKey="add-expenses"
                title="Buyurtma xarajatlari"
                size="max-w-4xl"
            >
                <OrderExpenses orderId={currentTripsOrder?.id} />
            </Modal>
        </div>
    )
}

export default TripOrderMain
