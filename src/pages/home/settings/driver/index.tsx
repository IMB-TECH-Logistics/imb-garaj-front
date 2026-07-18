import ParamInput from "@/components/as-params/input"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_DRIVERS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { PlusCircle } from "lucide-react"
import AddDriverModal from "./add-driver"
import { useColumnsDriverTable } from "./driver-cols"

const Drivers = () => {
    const hasControl = useHasAction("settings_drivers_control")
    const navigate = useNavigate()
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

    const { getData, setData, clearKey } = useGlobalStore()
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

    const handleAdd = () => {
        clearKey(SETTINGS_DRIVERS)
        openCreateModal()
    }

    const handleRowClick = (item: DriversType) => {
        navigate({
            to: "/manager-trips/$id",
            params: { id: item.id.toString() },
            search: {
                driver_id: item.id,
                name: `${item.first_name} ${item.last_name}`,
            } as any,
        })
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                numeration
                columns={columns}
                data={data?.results}
                onDelete={hasControl ? handleDelete : undefined}
                onEdit={
                    hasControl ?
                        ({ original }) => handleEdit(original)
                    :   undefined
                }
                onRowClick={handleRowClick}
                head={
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold">
                                Haydovchilar
                            </h1>

                            <Badge className="text-sm">
                                {formatMoney(data?.count ?? 0)}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                            <ParamInput
                                searchKey="driver_search"
                                pageKey="page"
                            />

                            {hasControl && (
                                <Button
                                    className="flex items-center gap-2"
                                    onClick={handleAdd}
                                    icon={<PlusCircle size={18} />}
                                >
                                    Qo'shish
                                </Button>
                            )}
                        </div>
                    </div>
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
