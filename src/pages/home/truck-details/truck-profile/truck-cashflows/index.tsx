import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { VEHICLES_CASHFLOWS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useParams, useSearch } from "@tanstack/react-router"
import AddVehicleCashflowModal from "./add-cashflows"
import { useColumnsCashflowsTable } from "./cashflows-cols"
import TableTruckHeader from "./truck-header"

const VehicleCashflows = () => {
    const search = useSearch({ strict: false })
    const params = useParams({ strict: false })
    const id = params.id
    const { data, isLoading } = useGet<ListResponse<VehicleCashflowsType>>(
        VEHICLES_CASHFLOWS,
        {
            params: {
                search: search.cashflow_search,
                page: search.page,
                page_size: search.page_size,
                vehicle:id
            },
        },
    )
    const { getData, setData } = useGlobalStore()
    const item = getData<VehicleCashflowsType>(VEHICLES_CASHFLOWS)

    const { openModal: openDeleteModal } = useModal("delete-vehicle-cashflow")
    const { openModal: openCreateModal } = useModal(`create-vehicle-cashflow`)
    const columns = useColumnsCashflowsTable()

    const handleDelete = (row: { original: VehicleCashflowsType }) => {
        setData(VEHICLES_CASHFLOWS, row.original)
        openDeleteModal()
    }
    const handleEdit = (item: VehicleCashflowsType) => {
        setData(VEHICLES_CASHFLOWS, item)
        openCreateModal()
    }
    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onDelete={handleDelete}
                onEdit={({ original }) => handleEdit(original)}
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableTruckHeader
                        storeKey={VEHICLES_CASHFLOWS}
                        modalKey="create-vehicle-cashflow"
                        disabled={!id}
                        pageKey="page"
                        name="vehicle-cashflow"
                        searchKey="cashflow_search"
                    />
                }
            />
            <DeleteModal
                path={VEHICLES_CASHFLOWS}
                refetchKeys={[VEHICLES_CASHFLOWS]}
                id={item?.id}
                modalKey="delete-vehicle-cashflow"
            />
            <Modal
                size="max-w-2xl"
                title={
                    item?.id ?
                        " Xarajatlarni tahrirlash"
                    :   " Xarajatlarni qo'shish"
                }
                modalKey="create-vehicle-cashflow"
            >
                <AddVehicleCashflowModal />
            </Modal>
        </>
    )
}

export default VehicleCashflows
