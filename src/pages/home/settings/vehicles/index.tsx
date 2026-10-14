import ParamTabs from "@/components/as-params/tabs"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { VEHICLES } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import TableHeader from "../table-header"
import AddTrailerModal from "./add-trailer"
import AddVehicleSettingsModal from "./add-vehicle"
import RemoveTrailerModal from "./remove-trailer"
import {
    useColumnsTrailersTable,
    useColumnsVehiclesTable,
} from "./vehicles-cols"

const VehiclesPage = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("settings_vehicles_control")
    const search = useSearch({ strict: false }) as Record<string, any>
    const isTrailers = search.tab === "trailers"
    const { data, isLoading } = useGet<ListResponse<VehicleDetailType>>(
        VEHICLES,
        {
            params: {
                search: search.vehicles_search,
                page: search.page,
                page_size: search.page_size,
                ordering: search.ordering,
                has_trailer: isTrailers || undefined,
            },
        },
    )
    const countParams = { search: search.vehicles_search, page_size: 1 }
    const { data: trucksCount } = useGet<ListResponse<VehicleDetailType>>(VEHICLES, {
        params: countParams,
    })
    const { data: trailersCount } = useGet<ListResponse<VehicleDetailType>>(VEHICLES, {
        params: { ...countParams, has_trailer: true },
    })
    const tabLabel = (label: string, count?: number) => (
        <span className="flex items-center gap-2">
            {label}
            {count !== undefined && <Badge className="text-xs">{formatMoney(count)}</Badge>}
        </span>
    )
    const { getData, setData } = useGlobalStore()
    const item = getData<VehicleDetailType>(VEHICLES)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal("create")
    const vehicleColumns = useColumnsVehiclesTable()
    const trailerColumns = useColumnsTrailersTable()
    const columns = isTrailers ? trailerColumns : vehicleColumns

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
                manualSorting
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
                        fileName={
                            isTrailers ?
                                t("settings.vehicles.tab_trailers")
                            :   t("nav.trucks")
                        }
                        title={
                            <ParamTabs
                                paramName="tab"
                                dontCleanOthers={false}
                                options={[
                                    {
                                        value: "trucks",
                                        label: tabLabel(t("settings.vehicles.tab_trucks"), trucksCount?.count),
                                    },
                                    {
                                        value: "trailers",
                                        label: tabLabel(t("settings.vehicles.tab_trailers"), trailersCount?.count),
                                    },
                                ]}
                            />
                        }
                        url="excel"
                        storeKey={hasControl ? VEHICLES : undefined}
                        searchKey="vehicles_search"
                        pageKey="page"
                    />
                }
            />
            {isTrailers ?
                <RemoveTrailerModal item={item} />
            :   <DeleteModal path={VEHICLES} id={item?.id} />}
            {isTrailers ?
                <Modal
                    title={
                        item?.id ?
                            t("settings.vehicles.edit_trailer")
                        :   t("settings.vehicles.add_trailer")
                    }
                    modalKey="create"
                    size="max-w-xl"
                >
                    <AddTrailerModal />
                </Modal>
            :   <Modal
                    title={
                        item?.id ?
                            t("form.edit_vehicle")
                        :   t("form.add_vehicle")
                    }
                    modalKey="create"
                    size="max-w-3xl"
                >
                    <AddVehicleSettingsModal />
                </Modal>
            }
        </>
    )
}

export default VehiclesPage
