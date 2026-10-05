import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { PLACES_GEO_ZONES, PLACES_GEO_ZONES_SELECT } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import TableHeader from "../table-header"
import AddGeoZoneModal from "./add-geo-zone"
import { type GeoZone, useGeoZoneColumns } from "./cols"

const GeoZonesPage = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("settings_geo_zones_control")
    const search = useSearch({ strict: false }) as Record<string, any>
    const { data, isLoading } = useGet<ListResponse<GeoZone>>(PLACES_GEO_ZONES, {
        params: {
            search: search.geo_zone_search,
            page: search.page,
            page_size: search.page_size,
        },
    })

    const { getData, setData } = useGlobalStore()
    const item = getData<GeoZone>(PLACES_GEO_ZONES)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal("create")
    const columns = useGeoZoneColumns()

    const handleDelete = (row: { original: GeoZone }) => {
        setData(PLACES_GEO_ZONES, row.original)
        openDeleteModal()
    }

    const handleEdit = (row: { original: GeoZone }) => {
        setData(PLACES_GEO_ZONES, row.original)
        openCreateModal()
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onDelete={hasControl ? handleDelete : undefined}
                onEdit={hasControl ? handleEdit : undefined}
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName={t("nav.geo_zones")}
                        url="excel"
                        storeKey={hasControl ? PLACES_GEO_ZONES : undefined}
                        searchKey="geo_zone_search"
                        pageKey="page"
                        count={data?.count}
                    />
                }
            />

            <DeleteModal
                path={PLACES_GEO_ZONES}
                id={item?.id}
                name={item?.name ? `«${item.name}» ` : ""}
                refetchKeys={[PLACES_GEO_ZONES_SELECT]}
            />

            <Modal
                title={item?.id ? "Joyni tahrirlash" : "Joy qo'shish"}
                modalKey="create"
                size="max-w-3xl"
            >
                <AddGeoZoneModal />
            </Modal>
        </>
    )
}

export default GeoZonesPage
