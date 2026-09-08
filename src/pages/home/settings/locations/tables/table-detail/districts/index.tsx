import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_DISTRICTS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import { MousePointerClick } from "lucide-react"
import TableHeaderLocation from "../../table-header"
import AddDestrictsModal from "./add-districts"
import { useColumnDestricts } from "./districts-cols"

interface DistrictsTableProps {
    country_id: number
    region_id?: string | number
}

/** Own pagination params — `page` belongs to the countries table above. */
const PAGE_PARAM = "district_page"
const PAGE_SIZE_PARAM = "district_page_size"

const DistrictsTable = ({ country_id, region_id }: DistrictsTableProps) => {
    const search = useSearch({ strict: false }) as Record<string, any>
    const { data, isLoading } = useGet<ListResponse<SettingsDistrictType>>(
        SETTINGS_DISTRICTS,
        {
            params:
                region_id ?
                    {
                        region: region_id,
                        search: search.district_search,
                        page: search[PAGE_PARAM],
                        page_size: search[PAGE_SIZE_PARAM],
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
                        pageKey={PAGE_PARAM}
                        name="Tumanlar"
                        searchKey="district_search"
                        title="Tumanlar"
                        count={region_id ? data?.count : 0}
                    />
                </div>
                {!region_id ? (
                    // Without this the table just renders an unexplained empty
                    // box and the "Qo'shish" button sits there disabled.
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
                        <MousePointerClick size={28} className="opacity-60" />
                        <p>
                            Tumanlarni ko'rish uchun chapdagi ro'yxatdan
                            joylashuvni tanlang.
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto no-scrollbar-0 no-scrollbar-x ">
                        <DataTable
                            loading={isLoading}
                            columns={columns}
                            wrapperClassName="bg-background"
                            data={data?.results}
                            onDelete={handleDelete}
                            onEdit={({ original }) => handleEdit(original)}
                            numeration={true}
                            className="min-w-[400px]"
                            paginationProps={{
                                totalPages: data?.total_pages,
                                paramName: PAGE_PARAM,
                                pageSizeParamName: PAGE_SIZE_PARAM,
                            }}
                        />
                    </div>
                )}
                <DeleteModal
                    modalKey="delete-districts"
                    path={SETTINGS_DISTRICTS}
                    id={item?.id}
                    name={
                        item?.id ? (
                            <span className="font-medium">
                                {`"${item.name ?? item.id}" tumani. `}
                            </span>
                        ) : (
                            ""
                        )
                    }
                />
                <Modal
                    size="max-w-2xl"
                    title={`Tuman ${item?.id ? "tahrirlash" : "qo'shish"}`}
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
