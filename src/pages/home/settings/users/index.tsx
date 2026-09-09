import DeleteModal from "@/components/custom/delete-modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_USERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useHasAction } from "@/constants/useUser"
import { useNavigate, useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import { useColumnsUsersTable } from "./users-cols"

const UsersPage = () => {
    const search = useSearch({ strict: false })
    const navigate = useNavigate()
    const { data, isLoading, error } = useGet<ListResponse<UserType>>(SETTINGS_USERS, {
        params: {
            search: search.first_name,
            page: search.page,
            page_size: search.page_size,
                /**
                 * Server tomon saralash (B-70/B-71, 5-raund): sarlavha
                 * bosilganda `?ordering=` URL'ga yoziladi va shu yerdan
                 * so'rovga qo'shiladi. Ilgari tanstack faqat ko'rinib turgan
                 * 25 qatorni tartiblardi va javob butun to'plamniki emas edi.
                 */
                ordering: search.ordering,
        },
    })
    const { getData, setData } = useGlobalStore()
    const item = getData<UserType>(SETTINGS_USERS)

    const { openModal: openDeleteModal } = useModal("delete")
    const hasControl = useHasAction("settings_users_control")
    const columns = useColumnsUsersTable()

    const handleDelete = (row: { original: UserType }) => {
        setData(SETTINGS_USERS, row.original)
        openDeleteModal()
    }
    const handleEdit = (item: UserType) => {
        navigate({ to: `/users/${item.id}/edit` })
    }
    return (
        <>
            <DataTable
                numeration
                loading={isLoading}
                error={error}
                columns={columns}
                data={data?.results}
                onDelete={hasControl ? handleDelete : undefined}
                onEdit={hasControl ? ({ original }) => handleEdit(original) : undefined}
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    // 2-raund (RBAC): `storeKey` berilgan bo'lsa TableHeader
                    // "Qo'shish" tugmasini `onAdd` siz ham chizadi — shu sababli
                    // 0 ruxsatli rol tugmani ko'rib, bosgach 403 olardi.
                    <TableHeader
                        fileName="Foydalanuvchilar"
                        url="excel"
                        storeKey={hasControl ? SETTINGS_USERS : undefined}
                        searchKey="first_name"
                        pageKey="page"
                        onAdd={hasControl ? () => navigate({ to: "/users/create" }) : undefined}
                        count={data?.count}
                    />
                }
            />
            <DeleteModal
                path={SETTINGS_USERS}
                refetchKeys={[SETTINGS_USERS]}
                id={item?.id}
                name={
                    item?.id ?
                        <span className="block font-medium mb-1">
                            Foydalanuvchi: «
                            {[item.first_name, item.last_name]
                                .filter(Boolean)
                                .join(" ") || item.username}
                            » ({item.username})
                        </span>
                    :   ""
                }
            />
        </>
    )
}

export default UsersPage
