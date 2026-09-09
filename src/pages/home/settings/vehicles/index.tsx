import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { VEHICLES } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import AddVehicleSettingsModal from "./add-vehicle"
import { useColumnsVehiclesTable } from "./vehicles-cols"

const VehiclesPage = () => {
    const hasControl = useHasAction("settings_vehicles_control")
    // `vehicles_search` is the key TableHeader writes below, but the shared
    // SearchParams type only declares `vehicle_search`, so read it untyped
    // (same pattern as the route-configs page).
    const search = useSearch({ strict: false }) as Record<string, any>
    const { data, isLoading } = useGet<ListResponse<VehicleDetailType>>(
        VEHICLES,
        {
            params: {
                search: search.vehicles_search,
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
                        fileName="Avtomobillar"
                        url="excel"
                        storeKey={hasControl ? VEHICLES : undefined}
                        searchKey="vehicles_search"
                        pageKey="page"
                        count={data?.count}
                    />
                }
            />
            <DeleteModal
                path={VEHICLES}
                id={item?.id}
                name={
                    item?.id ? (
                        <span className="font-medium">
                            {`"${item.truck_number ?? item.id}" raqamli avtomobil. `}
                        </span>
                    ) : (
                        ""
                    )
                }
            />
            <Modal
                title={
                    item?.id
                        ? "Avtomobilni tahrirlash"
                        : "Avtomobil qo'shish"
                }
                modalKey="create"
                size="max-w-3xl"
            >
                <AddVehicleSettingsModal />
            </Modal>
        </>
    )
}

export default VehiclesPage
