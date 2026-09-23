import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_DISTRICTS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import TableHeaderLocation from "../../table-header"
import AddDestrictsModal from "./add-districts"
import { useColumnDestricts } from "./districts-cols"

interface DistrictsTableProps {
    country_id: number
    region_id?: string | number
}

const DistrictsTable = ({ country_id, region_id }: DistrictsTableProps) => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false })
    const { data, isLoading } = useGet<ListResponse<SettingsDistrictType>>(
        SETTINGS_DISTRICTS,
        {
            params:
                region_id ?
                    {
                        region: region_id,
                        search: search.district_search,
                        page: 1,
                        page_size: 1000,
                    }
                :   {},
            enabled: !!region_id,
        },
    )

    const { getData, setData } = useGlobalStore()
    const item = getData<SettingsDistrictType>(SETTINGS_DISTRICTS)

    const { openModal: openDeleteModal } = useModal("delete-districts")
    const { openModal: openCreateModal } = useModal("create-districts")
    const columns = useColumnDestricts()
    const shownCount = region_id ? (data?.results?.length ?? 0) : 0
    const totalCount = region_id ? (data?.count ?? 0) : 0

    const handleDelete = (row: { original: SettingsDistrictType }) => {
        setData(SETTINGS_DISTRICTS, row.original)
        openDeleteModal()
    }

    const handleEdit = (item: SettingsDistrictType) => {
        setData(SETTINGS_DISTRICTS, item)
        openCreateModal()
    }

    return (
        <>
            <div className="h-[500px]  flex flex-col overflow-hidden bg-background">
                <div className="px-3 pt-3">
                    <TableHeaderLocation
                        storeKey={SETTINGS_DISTRICTS}
                        modalKey="create-districts"
                        disabled={!region_id}
                        pageKey="page"
                        name="tumanlar"
                        searchKey="district_search"
                        title={t("page.districts")}
                        count={region_id ? data?.count : 0}
                    />
                </div>
                {totalCount > shownCount && (
                    <div className="px-3 pb-2 text-xs text-destructive">
                        {totalCount} tadan {shownCount} tasi
                        ko&apos;rsatilmoqda — qidiruvdan foydalaning.
                    </div>
                )}
                <div className="flex-1 overflow-y-auto no-scrollbar-0 no-scrollbar-x ">
                    <DataTable
                        loading={isLoading}
                        columns={columns}
                        wrapperClassName="bg-background"
                        data={region_id ? data?.results : []}
                        onDelete={handleDelete}
                        onEdit={({ original }) => handleEdit(original)}
                        numeration={true}
                        actionPermissions={["settings_locations_control"]}
                        viewAll={true}
                        className="min-w-[400px]"
                    />
                </div>
                <DeleteModal
                    modalKey="delete-districts"
                    path={SETTINGS_DISTRICTS}
                    id={item?.id}
                />
                <Modal
                    size="max-w-2xl"
                    title={item?.id ? t("actions.edit") + " " + t("nav.locations").toLowerCase() : t("actions.add") + " " + t("nav.locations").toLowerCase()}
                    modalKey={"create-districts"}
                >
                    <AddDestrictsModal
                        region_id={region_id}
                        country_id={country_id}
                    />
                </Modal>
            </div>
        </>
    )
}

export default DistrictsTable
