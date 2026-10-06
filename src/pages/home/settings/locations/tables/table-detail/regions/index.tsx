import ParamPagination from "@/components/as-params/pagination"
import DeleteModal from "@/components/custom/delete-modal"
import EmptyBox from "@/components/custom/empty-box"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SETTINGS_REGIONS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import TableHeaderLocation from "../../table-header"
import AddRegionsModal from "./add-regions"
import { PlacesTable, RegionRowTable } from "./region-row"
import { useColumnsRegionsTable } from "./regions-cols"
const REGION_PAGE_KEY = "region_page"
const REGION_PAGE_SIZE_KEY = "region_page_size"

const RegionsTable = ({ country_id }: { country_id: number }) => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false })
    const navigate = useNavigate()
    const selectedId =
        Number((search as Record<string, unknown>).region) || null
    const selectRegion = (id: number) =>
        navigate({
            search: (prev: Record<string, unknown>) => ({
                ...prev,
                region: id,
            }),
        } as never)

    const isSearching = !!search.region_search

    const { data, isLoading } = useGet<ListResponse<RegionsType>>(
        `${SETTINGS_REGIONS}`,
        {
            params: {
                country: country_id,
                top_level: isSearching ? undefined : true,
                search: search.region_search,
                page: search[REGION_PAGE_KEY],
                page_size: search[REGION_PAGE_SIZE_KEY],
                ordering: (search as any).ordering,
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
    const selectedRegion =
        data?.results?.find((r) => r.id === selectedId) ?? null
    return (
        <div className="h-[560px] grid grid-cols-1 md:grid-cols-2 gap-3 overflow-hidden bg-background p-3">
            <div className="rounded-md border flex flex-col min-h-0">
                <div className="px-3 pt-3">
                    <TableHeaderLocation
                        disabled={!country_id}
                        storeKey={SETTINGS_REGIONS}
                        modalKey="create-region"
                        name="Viloyatlar"
                        searchKey="region_search"
                        pageKey={REGION_PAGE_KEY}
                        title={t("page.locations_title")}
                        count={data?.count}
                    />
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar-x">
                    {isSearching ?
                        <DataTable
                            manualSorting
                            loading={isLoading}
                            columns={simpleColumns}
                            data={data?.results}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            className="min-w-[400px]"
                            numeration={true}
                            actionPermissions={["settings_locations_control"]}
                            paginationProps={{
                                totalPages: data?.total_pages,
                                paramName: REGION_PAGE_KEY,
                                pageSizeParamName: REGION_PAGE_SIZE_KEY,
                            }}
                            wrapperClassName="!bg-transparent"
                        />
                    :   <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            #
                                        </TableHead>
                                        <TableHead className="whitespace-nowrap">
                                            {t("form.region")}
                                        </TableHead>
                                        <TableHead className="w-[40px]" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading && (
                                        <TableRow>
                                            <TableCell colSpan={3}>
                                                <Skeleton className="h-6 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {data?.results?.map((region, index) => (
                                        <RegionRowTable
                                            key={region.id}
                                            region={region}
                                            index={index}
                                            selected={region.id === selectedId}
                                            onSelect={() =>
                                                selectRegion(region.id)
                                            }
                                        />
                                    ))}
                                    {data?.results?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3}>
                                                <EmptyBox height="h-40" />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <div className="flex my-3 justify-center">
                                <ParamPagination
                                    totalPages={data?.total_pages}
                                    paramName={REGION_PAGE_KEY}
                                    pageSizeParamName={REGION_PAGE_SIZE_KEY}
                                />
                            </div>
                        </>
                    }
                </div>
            </div>
            <div className="rounded-md border min-h-0">
                <PlacesTable region={selectedRegion} />
            </div>
            <DeleteModal
                modalKey="delete-region"
                path={SETTINGS_REGIONS}
                id={item?.id}
                name={item?.name}
            />
            <Modal
                size="max-w-2xl"
                title={
                    (item?.id ? t("actions.edit") : t("actions.add")) +
                    " " +
                    (item?.parent ?
                        t("form.place")
                    :   t("form.region")
                    ).toLowerCase()
                }
                modalKey={"create-region"}
            >
                <AddRegionsModal country_id={country_id} />
            </Modal>
        </div>
    )
}

export default RegionsTable
