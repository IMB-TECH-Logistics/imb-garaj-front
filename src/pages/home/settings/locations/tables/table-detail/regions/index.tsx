import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_REGIONS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import TableHeaderLocation from "../../table-header"
import AddRegionsModal from "./add-regions"
import { useColumnsRegionsTable } from "./regions-cols"

/**
 * Own pagination params: the countries table on the same screen already owns
 * `page` / `page_size`, so this nested table would fight it. Previously the
 * query was pinned to `page_size: 1000` with `totalPages: 1`, which silently
 * dropped every location past the thousandth (UI audit S1-13).
 */
const PAGE_PARAM = "region_page"
const PAGE_SIZE_PARAM = "region_page_size"

const RegionsTable = ({ country_id }: { country_id: number }) => {
    const search = useSearch({ strict: false }) as Record<string, any>
    const navigate = useNavigate()

    const { data, isLoading } = useGet<ListResponse<RegionsType>>(
        `${SETTINGS_REGIONS}`,
        {
            params: {
                country: country_id,
                search: search.region_search,
                page: search[PAGE_PARAM],
                page_size: search[PAGE_SIZE_PARAM],
            },
        },
    )
    const { getData, setData } = useGlobalStore()
    const item = getData<RegionsType>(SETTINGS_REGIONS)

    const { openModal: openDeleteModal } = useModal("delete-region")
    const { openModal: openCreateModal } = useModal("create-region")

    const handleEdit = (row: { original: RegionsType }) => {
        setData(SETTINGS_REGIONS, row.original)
        openCreateModal()
    }

    const handleDelete = (row: { original: RegionsType }) => {
        setData(SETTINGS_REGIONS, row.original)
        openDeleteModal()
    }

    /**
     * Selecting a location opens its districts next to this table. This was
     * written and then commented out, which left the third level of the
     * location hierarchy unreachable from the UI (UI audit S1-12).
     */
    const handleRowClick = (row: RegionsType) => {
        const isCurrentlySelected = String(search.region) === String(row.id)
        navigate({
            search: ((prev: Record<string, unknown>) => ({
                ...prev,
                region: isCurrentlySelected ? undefined : String(row.id),
                district_page: undefined,
            })) as any,
        })
    }

    const simpleColumns = useColumnsRegionsTable(search.region)
    return (
        <div className="h-[500px] flex flex-col   overflow-hidden bg-background">
            <div className="px-3 pt-3">
                <TableHeaderLocation
                    disabled={!country_id}
                    storeKey={SETTINGS_REGIONS}
                    modalKey="create-region"
                    name="Joylashuvlar"
                    searchKey="region_search"
                    pageKey={PAGE_PARAM}
                    title="Joylashuvlar"
                    count={data?.count}
                />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar-x ">
                <DataTable
                    loading={isLoading}
                    columns={simpleColumns}
                    data={data?.results}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRowClick={handleRowClick}
                    className="min-w-[400px]"
                    numeration={true}
                    paginationProps={{
                        totalPages: data?.total_pages,
                        paramName: PAGE_PARAM,
                        pageSizeParamName: PAGE_SIZE_PARAM,
                    }}
                    wrapperClassName="!bg-transparent"
                />
            </div>
            <DeleteModal
                modalKey="delete-region"
                path={SETTINGS_REGIONS}
                id={item?.id}
                name={
                    item?.id ? (
                        <span className="font-medium">
                            {`"${item.name ?? item.id}" joylashuvi. `}
                        </span>
                    ) : (
                        ""
                    )
                }
            />
            <Modal
                size="max-w-2xl"
                title={`Joylashuv ${item?.id ? "tahrirlash" : "qo'shish"}`}
                modalKey={"create-region"}
            >
                <AddRegionsModal country_id={country_id} />
            </Modal>
        </div>
    )
}

export default RegionsTable
