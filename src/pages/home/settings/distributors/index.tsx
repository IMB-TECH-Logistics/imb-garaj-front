import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_DISTRIBUTORS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import { useColumnsDistributorsTable } from "./distributors-cols"

const Distributors = () => {
    const search = useSearch({ strict: false })
    const { data, isLoading } = useGet<ListResponse<DistributorType>>(
        SETTINGS_DISTRIBUTORS,
        {
            params: {
                search: (search as any).distributor_search,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )
    const columns = useColumnsDistributorsTable()

    return (
        <DataTable
            loading={isLoading}
            columns={columns}
            data={data?.results}
            numeration={true}
            paginationProps={{
                totalPages: data?.total_pages,
                paramName: "page",
                pageSizeParamName: "page_size",
            }}
            head={
                <TableHeader
                    fileName="Distributorlar"
                    url="excel"
                    pageKey="page"
                    searchKey="distributor_search"
                    count={data?.count}
                />
            }
        />
    )
}

export default Distributors
