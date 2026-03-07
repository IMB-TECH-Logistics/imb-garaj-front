import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { TECHNICAL_INSPECT } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useParams, useSearch } from "@tanstack/react-router"
import TableHeader from "../../settings/table-header"
import { useTechnicInspect } from "./cols"
import CreateTechnicInspect from "./create"

const TruckCheck = () => {
    const { id } = useParams({ strict: false })
    const { data: inspect, isLoading } = useGet<ListResponse<TechnicInspect>>(
        `${TECHNICAL_INSPECT}`,
        {
            params: {
                vehicle: id,
            },
        },
    )
    const search = useSearch({ strict: false })
    const { getData, setData } = useGlobalStore()
    const item = getData<RolesType>(TECHNICAL_INSPECT)
    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal(`create`)
    const columns = useTechnicInspect()

    const handleDelete = (row: { original: TechnicInspect }) => {
        setData(TECHNICAL_INSPECT, row.original)
        openDeleteModal()
    }
    const handleEdit = (item: TechnicInspect) => {
        setData(TECHNICAL_INSPECT, item)
        openCreateModal()
    }
    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns || []}
                data={inspect?.results || []}
                onDelete={handleDelete}
                onEdit={({ original }) => handleEdit(original)}
                numeration
                paginationProps={{
                    totalPages: inspect?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName="Rollar"
                        url="excel"
                        storeKey={TECHNICAL_INSPECT}
                        searchKey="roles_search"
                        pageKey="page"
                    />
                }
            />
            <DeleteModal path={TECHNICAL_INSPECT} id={item?.id} />
            <Modal
                modalKey="create"
                title={
                    item?.id ?
                        "Texnik ko'rikni tahrirlash"
                    :   "Texnik ko'rik qo'shish"
                }
            >
                <CreateTechnicInspect />
            </Modal>
        </>
    )
}

export default TruckCheck
