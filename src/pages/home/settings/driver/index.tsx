import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_DRIVERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import AddDriverModal from "./add-driver"
import { useColumnsDriverTable } from "./driver-cols"

const Drivers = () => {
    const search = useSearch({ strict: false })
    const { data, isLoading } = useGet<ListResponse<DriversType>>(
        SETTINGS_DRIVERS,
        {
            params: {
                search: search.driver_search,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )
    const { getData, setData } = useGlobalStore()
    const item = getData<DriversType>(SETTINGS_DRIVERS)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal(`create`)
    const columns = useColumnsDriverTable()

    const handleDelete = (row: { original: DriversType }) => {
        setData(SETTINGS_DRIVERS, row.original)
        openDeleteModal()
    }
    const handleEdit = (item: DriversType) => {
        setData(SETTINGS_DRIVERS, item)
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
                head={
                    <TableHeader
                        fileName="Haydovchilar"
                        url="excel"
                        storeKey={SETTINGS_DRIVERS}
                        pageKey="page"
                        searchKey="driver_search"
                    />
                }
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
            />
            <DeleteModal
                path={SETTINGS_DRIVERS}
                refetchKeys={[SETTINGS_DRIVERS]}
                id={item?.id}
            />
            <Modal
                size="max-w-2xl"
                title={
                    item?.id ? " Haydovchini tahrirlash" : " Haydovchi qo'shish"
                }
                modalKey="create"
            >
                <AddDriverModal />
            </Modal>
        </>
    )
}

export default Drivers
