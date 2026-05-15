import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_REGIONS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import TableHeaderLocation from "../../table-header"
import AddRegionsModal from "./add-regions"
import { useColumnsRegionsTable } from "./regions-cols"
const RegionsTable = ({ country_id }: { country_id: number }) => {
    const search = useSearch({ strict: false })

    const { data, isLoading } = useGet<ListResponse<RegionsType>>(
        `${SETTINGS_REGIONS}`,
        {
            params: {
                country: country_id,
                search: search.region_search,
                page: 1,
                page_size: 1000,
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

    // const handleRowClick = (row: RegionsType) => {
    //     const isCurrentlySelected = search.region === row.id
    //     const updateSearch = (prev: typeof search): Partial<typeof search> => ({
    //         ...prev,
    //         region: isCurrentlySelected ? undefined : row.id,
    //     })
    //     navigate({ search: updateSearch as any })
    // }

    const simpleColumns = useColumnsRegionsTable()
    return (
        <div className="h-[500px] flex flex-col   overflow-hidden bg-background">
            <div className="px-3 pt-3">
                <TableHeaderLocation
                    disabled={!country_id}
                    storeKey={SETTINGS_REGIONS}
                    modalKey="create-region"
                    name="Viloyatlar"
                    searchKey="region_search"
                    pageKey="page"
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
                    className="min-w-[400px]"
                    numeration={true}
                    viewAll={true}
                    paginationProps={{ totalPages: 1 }}
                    wrapperClassName="!bg-transparent"
                />
            </div>
            <DeleteModal
                modalKey="delete-region"
                path={SETTINGS_REGIONS}
                id={item?.id}
            />
            <Modal
                size="max-w-2xl"
                title={`Viloyat ${item?.id ? "tahrirlash" : "qo'shish"}`}
                modalKey={"create-region"}
            >
                <AddRegionsModal country_id={country_id} />
            </Modal>
        </div>
    )
}

export default RegionsTable
