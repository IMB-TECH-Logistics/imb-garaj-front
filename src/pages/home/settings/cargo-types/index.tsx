import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_CARGO_TYPE } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import AddCargoModal from "./add-cargo"
import { useColumnsCargoTable } from "./cargo-cols"

const CargoPage = () => {
    const hasControl = useHasAction("settings_cargo_types_control")
    const search = useSearch({ strict: false })

    const { data, isLoading } = useGet<ListResponse<RolesType>>(
        SETTINGS_CARGO_TYPE,
        {
            params: {
                search: search.cargo_search,
            },
        },
    )

    const { getData, setData } = useGlobalStore()
    const item = getData<RolesType>(SETTINGS_CARGO_TYPE)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal(`create`)
    const columns = useColumnsCargoTable()

    const handleDelete = (row: { original: RolesType }) => {
        setData(SETTINGS_CARGO_TYPE, row.original)
        openDeleteModal()
    }

    const handleEdit = (item: RolesType) => {
        setData(SETTINGS_CARGO_TYPE, item)
        openCreateModal()
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onDelete={hasControl ? handleDelete : undefined}
                onEdit={
                    hasControl ?
                        ({ original }) => handleEdit(original)
                    :   undefined
                }
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                }}
                head={
                    <TableHeader
                        fileName="Yuk turi"
                        url="excel"
                        storeKey={hasControl ? SETTINGS_CARGO_TYPE : undefined}
                        searchKey="cargo_search"
                        pageKey="page"
                        count={data?.count}
                    />
                }
            />

            <DeleteModal path={SETTINGS_CARGO_TYPE} id={item?.id} />

            <Modal
                title={
                    item?.id ? "Yuk turini tahrirlash" : " Yuk turini  qo'shish"
                }
                modalKey="create"
            >
                <AddCargoModal />
            </Modal>
        </>
    )
}

export default CargoPage
