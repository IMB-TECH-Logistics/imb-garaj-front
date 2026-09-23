import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { MANAGERS_ORDERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { ArrowLeft, CirclePlus } from "lucide-react"
import AddTripOrders from "./create"
import { DataTable } from "@/components/ui/datatable"
import { useTripOrdersCols } from "./new-cols"
import AddExpenses from "./create/expense"
import AddCashflow from "./cashfow/add-cashflow"
import { useTranslation } from "react-i18next"

const TripOrderMain = () => {
    const { t } = useTranslation()
    const params = useParams({ strict: false })
    const search = useSearch({ strict: false })
    const page = Number(search.page ?? 1)
    const { getData, setData, clearKey } = useGlobalStore()
    const { openModal: openCreateModal } = useModal("create")
    const { openModal: AddExpenseModal } = useModal("add-expenses")

    const { openModal: openDeleteModal } = useModal("delete")
    const navigate = useNavigate()

    const parentId = params.parentId
    const currentTripsOrder = getData<TripsOrders>(MANAGERS_ORDERS)

    const { data, isLoading } = useGet<ListResponse<TripOrdersRow>>(
        MANAGERS_ORDERS,
        {
            params: {
                trip: parentId,
                page,
            },
        },
    )

    const handleCreate = () => {
        clearKey(MANAGERS_ORDERS)
        openCreateModal()
    }

    const handleEdit = (order: TripOrdersRow) => {
        setData(MANAGERS_ORDERS, order)
        openCreateModal()
    }

    const handleDelete = (order: TripOrdersRow) => {
        setData(MANAGERS_ORDERS, order)
        openDeleteModal()
    }

    // const handleRowClick = (order: TripOrdersRow) => {
    //     const childId = order.id
    //     const parentId = params.parentId

    //     if (!childId || !parentId) return

    //     navigate({
    //         to: "/trip/$parentId/$childId",
    //         params: {
    //             parentId: parentId.toString(),
    //             childId: childId.toString(),
    //         },
    //     })
    // }

    const handleAdd = (order: TripOrdersRow) => {
        setData(MANAGERS_ORDERS, order)
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
                    <h1 className="font-bold">{t("page.trip_list")}</h1>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleCreate}>
                        <CirclePlus size={18} />
                        {t("actions.add")}
                    </Button>
                </div>
            </div>

            <div className="bg-card rounded-md p-3">
                <DataTable
                    loading={isLoading}
                    columns={columns}
                    data={data?.results}
                    numeration
                    onEdit={({ original }) => handleEdit(original)}
                    onDelete={({ original }) => handleDelete(original)}
                    paginationProps={{
                        totalPages: 1,
                    }}
                    onView={({ original }) => handleAdd(original)}
                />
            </div>

            <Modal
                modalKey="create"
                size="max-w-2xl"
                title={`${t("page.order_detail")} ${currentTripsOrder?.id ? t("actions.edit") : t("actions.add")}`}
            >
                <AddTripOrders />
            </Modal>

            <DeleteModal path={MANAGERS_ORDERS} id={currentTripsOrder?.id} />
            <Modal modalKey="add-expenses">
                <AddCashflow/> </Modal>
        </div>
    )
}

export default TripOrderMain
