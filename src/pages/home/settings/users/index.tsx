import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_USERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import AddUserModal from "./add-users"
import { useColumnsUsersTable } from "./users-cols"

const UsersPage = () => {
    const search = useSearch({ strict: false })
    const { data, isLoading } = useGet<ListResponse<UserType>>(SETTINGS_USERS, {
        params: {
            search: search.first_name,
            page: search.page,
            page_size: search.page_size,
        },
    })
    const { getData, setData } = useGlobalStore()
    const item = getData<UserType>(SETTINGS_USERS)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal(`create`)
    const columns = useColumnsUsersTable()

    const handleDelete = (row: { original: UserType }) => {
        setData(SETTINGS_USERS, row.original)
        openDeleteModal()
    }
    const handleEdit = (item: UserType) => {
        setData(SETTINGS_USERS, item)
        openCreateModal()
    }
    return (
        <>
            <DataTable
                numeration
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onDelete={handleDelete}
                onEdit={({ original }) => handleEdit(original)}
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName="Haydovchilar"
                        url="excel"
                        storeKey={SETTINGS_USERS}
                        searchKey="first_name"
                        pageKey="page"
                    />
                }
            />
            <DeleteModal
                path={SETTINGS_USERS}
                refetchKeys={[SETTINGS_USERS]}
                id={item?.id}
            />
            <Modal
                size="max-w-2xl"
                title={
                    item?.id ?
                        " Foydalanuvchi tahrirlash"
                    :   " Foydalanuvchi qo'shish"
                }
                modalKey="create"
            >
                <AddUserModal />
            </Modal>
        </>
    )
}

export default UsersPage
