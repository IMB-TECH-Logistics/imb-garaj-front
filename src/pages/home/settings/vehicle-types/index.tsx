import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_VEHICLE_TYPE } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import AddVehicleModal from "./add-vehicle"
import { useColumnsVehicleTable } from "./vehicle-cols"

const VehicleTypePage = () => {
    const hasControl = useHasAction("settings_vehicle_types_control")
    const search = useSearch({ strict: false })
    const { data, isLoading } = useGet<ListResponse<VehicleRoleType>>(
        SETTINGS_VEHICLE_TYPE,
        {
            params: {
                search: search.vehicle_search,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )
    const { getData, setData } = useGlobalStore()
    const item = getData<VehicleRoleType>(SETTINGS_VEHICLE_TYPE)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal(`create`)
    const columns = useColumnsVehicleTable()

    const handleDelete = (row: { original: VehicleRoleType }) => {
        setData(SETTINGS_VEHICLE_TYPE, row.original)
        openDeleteModal()
    }
    const handleEdit = (item: VehicleRoleType) => {
        setData(SETTINGS_VEHICLE_TYPE, item)
        openCreateModal()
    }
    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onDelete={hasControl ? handleDelete : undefined}
                onEdit={hasControl ? ({ original }) => handleEdit(original) : undefined}
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName="Mashina turlari"
                        url="excel"
                        storeKey={hasControl ? SETTINGS_VEHICLE_TYPE : undefined}
                        searchKey="vehicle_search"
                        pageKey="page"
                        count={data?.count}
                    />
                }
            />
            <DeleteModal path={SETTINGS_VEHICLE_TYPE} id={item?.id} />
            <Modal
                title={
                    item?.id ?
                        "Avtomobil turinni tahrirlash"
                    :   " Avtomobil qo'shish"
                }
                modalKey="create"
            >
                <AddVehicleModal />
            </Modal>
        </>
    )
}

export default VehicleTypePage
