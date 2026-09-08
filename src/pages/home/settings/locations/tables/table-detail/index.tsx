import { useSearch } from "@tanstack/react-router"
import DistrictsTable from "./districts"
import RegionsTable from "./regions"

interface CountriesDetailRow {
    country_id: number
}

/**
 * Second and third level of the location hierarchy. The districts table was
 * fully written but never rendered, so tumanlar could not be created, renamed
 * or deleted from the UI even though trip creation offers them as a dropdown
 * (UI audit S1-12). Selecting a location on the left now opens its districts
 * on the right; the selected id lives in the `region` search param, which
 * `country-row.tsx` already clears when another country is opened.
 */
export const CountriesDetailRow = ({ country_id }: CountriesDetailRow) => {
    const search = useSearch({ strict: false }) as Record<string, any>
    const region_id = search.region

    return (
        <div className="">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <RegionsTable country_id={country_id} />
                <DistrictsTable
                    country_id={country_id}
                    region_id={region_id}
                />
            </div>
        </div>
    )
}
