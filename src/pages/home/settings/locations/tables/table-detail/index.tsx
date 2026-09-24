import RegionsTable from "./regions"

interface CountriesDetailRow {
    country_id: number
}

export const CountriesDetailRow = ({ country_id }: CountriesDetailRow) => {
    return (
        <div className="">
            <div className="grid grid-cols-1 gap-4">
                <RegionsTable country_id={country_id} />
            </div>
        </div>
    )
}
