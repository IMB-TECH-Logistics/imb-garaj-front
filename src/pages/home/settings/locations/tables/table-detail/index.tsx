import { useSearch } from "@tanstack/react-router"
import DistrictsTable from "./districts"
import RegionsTable from "./regions"

interface CountriesDetailRow {
    country_id: number
}

export const CountriesDetailRow = ({ country_id }: CountriesDetailRow) => {
    const search = useSearch({ strict: false })
    const selectedRegionId = search.region

    return (
        <div className="">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RegionsTable country_id={country_id} />
                <DistrictsTable
                    country_id={country_id}
                    region_id={selectedRegionId}
                />
            </div>
        </div>
    )
}
