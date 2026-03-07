import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_ROLES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import AddRolesModal from "./add-roles"
import { useColumnsRolesTable } from "./roles-cols"

const RolesPage = () => {
    const search = useSearch({ strict: false })
    const { data, isLoading } = useGet<ListResponse<RolesType>>(
        SETTINGS_ROLES,
        {
            params: {
                search: search.roles_search,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )
    const { getData, setData } = useGlobalStore()
    const item = getData<RolesType>(SETTINGS_ROLES)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal(`create`)
    const columns = useColumnsRolesTable()

    const handleDelete = (row: { original: RolesType }) => {
        setData(SETTINGS_ROLES, row.original)
        openDeleteModal()
    }
    const handleEdit = (item: RolesType) => {
        setData(SETTINGS_ROLES, item)
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
                        fileName="Rollar"
                        url="excel"
                        storeKey={SETTINGS_ROLES}
                        searchKey="roles_search"
                        pageKey="page"
                    />
                }
            />
            <DeleteModal path={SETTINGS_ROLES} id={item?.id} />
            <Modal
                title={item?.id ? "Rolllarni tahrirlash" : " Rollarni qo'shish"}
                modalKey="create"
            >
                <AddRolesModal />
            </Modal>
        </>
    )
}

export default RolesPage
