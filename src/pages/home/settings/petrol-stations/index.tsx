import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import AddPetrolStationModal from "./add-petrol"
import { type PetrolStationRow, usePetrolStationColumns } from "./cols"

const PetrolStationsPage = () => {
    const hasControl = useHasAction("settings_petrol_stations_control")
    const search = useSearch({ strict: false }) as Record<string, any>
    const navigate = useNavigate()
    const { getData, setData } = useGlobalStore()
    const item = getData<PetrolStationRow>(SETTINGS_PETROL_STATIONS)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal("create")

    const { data, isLoading } = useGet<ListResponse<PetrolStationRow>>(
        SETTINGS_PETROL_STATIONS,
        {
            params: {
                search: search.petrol_search,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )

    const columns = usePetrolStationColumns()

    const handleEdit = (row: { original: PetrolStationRow }) => {
        setData(SETTINGS_PETROL_STATIONS, row.original)
        openCreateModal()
    }

    const handleDelete = (row: { original: PetrolStationRow }) => {
        setData(SETTINGS_PETROL_STATIONS, row.original)
        openDeleteModal()
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onDelete={hasControl ? handleDelete : undefined}
                onEdit={hasControl ? handleEdit : undefined}
                onRowClick={(row) =>
                    navigate({
                        to: "/petrol-stations/$id",
                        params: { id: String(row.id) },
                    })
                }
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName="Zapravkalar"
                        url="excel"
                        storeKey={
                            hasControl ? SETTINGS_PETROL_STATIONS : undefined
                        }
                        searchKey="petrol_search"
                        pageKey="page"
                    />
                }
            />
            <DeleteModal path={SETTINGS_PETROL_STATIONS} id={item?.id} />
            <Modal
                title={
                    item?.id ? "Zapravkani tahrirlash" : "Zapravka qo'shish"
                }
                modalKey="create"
                size="max-w-2xl"
            >
                <AddPetrolStationModal />
            </Modal>
        </>
    )
}

export default PetrolStationsPage
