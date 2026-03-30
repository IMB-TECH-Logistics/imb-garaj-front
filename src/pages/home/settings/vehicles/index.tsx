import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { VEHICLES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import AddVehicleSettingsModal from "./add-vehicle"
import { useColumnsVehiclesTable } from "./vehicles-cols"

const VehiclesPage = () => {
    const search = useSearch({ strict: false })
    const { data, isLoading } = useGet<ListResponse<VehicleDetailType>>(
        VEHICLES,
        {
            params: {
                search: search.vehicles_search,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )
    const { getData, setData } = useGlobalStore()
    const item = getData<VehicleDetailType>(VEHICLES)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal("create")
    const columns = useColumnsVehiclesTable()

    const handleDelete = (row: { original: VehicleDetailType }) => {
        setData(VEHICLES, row.original)
        openDeleteModal()
    }
    const handleEdit = (item: VehicleDetailType) => {
        setData(VEHICLES, item)
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
                    <TableHeader
                        fileName="Avtomobillar"
                        url="excel"
                        storeKey={VEHICLES}
                        searchKey="vehicles_search"
                        pageKey="page"
                    />
                }
            />
            <DeleteModal path={VEHICLES} id={item?.id} />
            <Modal
                title={
                    item?.id
                        ? "Avtomobilni tahrirlash"
                        : "Avtomobil qo'shish"
                }
                modalKey="create"
            >
                <AddVehicleSettingsModal />
            </Modal>
        </>
    )
}

export default VehiclesPage
