import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { TRIPS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { useCostCols } from "./cols"
import AddTrip from "./truck-trips-add"
import TruckTripsHeader from "./truck-trips-header"

const VehicleTrips = () => {
    const { setData, getData } = useGlobalStore()
    const navigate = useNavigate()
    const { openModal: openCreateModal } = useModal("post-trips")
    const { openModal: openDeleteModal } = useModal("delete")

    const params = useParams({ strict: false })
    const search = useSearch({ strict: false })
    const { data, isLoading } = useGet<ListResponse<TripRow>>(TRIPS, {
        params: {
            vehicle: params.id,
            ...search,
            page: search.page,
            page_size: search.page_size,
        },
    })
    const item = getData<TripRow>(TRIPS)

    const columns = useCostCols()

    const handleRowClick = (item: TripRow) => {
        const id = item?.id
        if (!id) return
        navigate({
            to: "/trip-orders/$id",
            params: { id: id.toString() },
        })
    }

    const handleEdit = (item: TripRow) => {
        setData(TRIPS, item)
        openCreateModal()
    }
    const handleDelete = (row: { original: TripRow }) => {
        setData(TRIPS, row.original)
        openDeleteModal()
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center mb-3 gap-4"></div>

            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                numeration
                onRowClick={handleRowClick}
                onEdit={({ original }) => handleEdit(original)}
                onDelete={handleDelete}
                head={<TruckTripsHeader />}
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
            />
            <DeleteModal path={TRIPS} id={item?.id} />
            <Modal
                size="max-w-2xl"
                title={item?.id ? "Reysni tahrirlash" : "Reys qo'shish "}
                modalKey="post-trips"
            >
                <AddTrip />
            </Modal>
        </div>
    )
}

export default VehicleTrips
