import ParamPagination from "@/components/as-params/pagination"
import DeleteModal from "@/components/custom/delete-modal"
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SETTINGS_COUNTRIES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import { Key } from "react"
import { useColumnsCountriesTable } from "./country-cols"
import { CountryRowTable } from "./country-row"

const CountriesTable = () => {
    const search = useSearch({ strict: false })
    const { data } = useGet<ListResponse<RolesType>>(SETTINGS_COUNTRIES, {
        params: {
            search: search.country_search,
            page: search.page,
            page_size: search.page_size,
        },
    })
    const { getData } = useGlobalStore()
    const selectedCountry = getData(SETTINGS_COUNTRIES) as RolesType | null
    const columns = useColumnsCountriesTable()
    const totalColumns = columns.length + 2

    return (
        <div className="">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map(
                                (
                                    column: any,
                                    index: Key | null | undefined,
                                ) => (
                                    <TableHead
                                        key={index}
                                        className="whitespace-nowrap"
                                    >
                                        {column.header}
                                    </TableHead>
                                ),
                            )}
                            <TableHead className="whitespace-nowrap text-right"></TableHead>
                            <TableHead className="w-[40px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.results.map((country, index) => (
                            <CountryRowTable
                                key={country.id}
                                countries={country}
                                index={index}
                                colSpan={totalColumns}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex my-3 justify-center">
                <ParamPagination totalPages={data?.total_pages} />
            </div>

            <DeleteModal
                modalKey="delete-country"
                path={SETTINGS_COUNTRIES}
                id={selectedCountry?.id}
            />
        </div>
    )
}

export default CountriesTable
