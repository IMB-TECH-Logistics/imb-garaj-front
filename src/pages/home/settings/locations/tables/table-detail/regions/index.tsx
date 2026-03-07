import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_REGIONS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect } from "react"
import TableHeaderLocation from "../../table-header"
import AddRegionsModal from "./add-regions"
import { useColumnsRegionsTable } from "./regions-cols"
const RegionsTable = ({ country_id }: { country_id: number }) => {
    const navigate = useNavigate()
    const search = useSearch({ strict: false })
    const selectedRegionId =
        search.region != null ? Number(search.region) : undefined

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

    const handleRowClick = (row: RegionsType) => {
        const isCurrentlySelected = search.region === row.id

        const updateSearch = (prev: typeof search): Partial<typeof search> => ({
            ...prev,
            region: isCurrentlySelected ? undefined : row.id,
        })

        navigate({
            search: updateSearch as any,
        })
    }

    useEffect(() => {
        if (data?.results?.length && !search.region && country_id) {
            const firstRegion = data.results[0]

            const updateSearch = (
                prev: typeof search,
            ): Partial<typeof search> => ({
                ...prev,
                region: firstRegion.id,
            })

            navigate({
                search: updateSearch as any,
            })
        }
    }, [data, search.region, country_id, navigate])

    const simpleColumns = useColumnsRegionsTable()
    return (
        <div className="h-[500px] flex flex-col   overflow-hidden bg-background">
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
                    head={
                        <TableHeaderLocation
                            disabled={!country_id}
                            storeKey={SETTINGS_REGIONS}
                            modalKey="create-region"
                            name="Viloyatlar"
                            searchKey="region_search"
                            pageKey="page"
                        />
                    }

                    viewAll={true}
                    paginationProps={{ totalPages: 1 }}
                    wrapperClassName="!bg-transparent"
                    rowColor={(r: any) => {
                        const rowId = Number(r?.original?.id ?? r?.id)
                        const isSelected = selectedRegionId === rowId

                        return isSelected ?
                                [
                                    "[&>td]:!bg-primary/10",
                                    "hover:[&>td]:!bg-primary/15",
                                    "[&>td]:border-y-2 [&>td]:border-primary/60",
                                    "[&>td:first-child]:border-l-2 [&>td:last-child]:border-r-2",
                                    "[&>td]:!rounded-none",
                                ].join(" ")
                            :   ""
                    }}
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
