import { ParamCombobox } from "@/components/as-params/combobox"
import ParamDateRange from "@/components/as-params/date-picker-range"
import { Button } from "@/components/ui/button" // Import Button
import {
    COMMON_SELECTABLE_VEHICLE_TYPE,
    SETTINGS_SELECTABLE_USERS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { X } from "lucide-react" // Import clear icon

const TruckTripsHeader = () => {
    const navigate = useNavigate()
    const search = useSearch({ strict: false })

    const { data: driversData } = useGet<DriversType[]>(
        SETTINGS_SELECTABLE_USERS,
        {
            params: {
                role: "1",
            },
        },
    )

    const { data: vehicleData } = useGet<ListResponse<VehicleType>>(
        COMMON_SELECTABLE_VEHICLE_TYPE,
    )
    console.log("check",vehicleData);
    

    const hasActiveFilters =
        search.driver ||
        search.vehicle ||
        search.from_date ||
        search.to_date

    const clearAllFilters = () => {
        navigate({
            to: location.pathname,
            search: {
                ...search,
                driver: undefined,
                vehicle: undefined,
                from_date: undefined,
                to_date: undefined,
            },
        })
    }

    return (
        <div className="flex items-center gap-3 mb-3">
            <h1 className="text-xl">Reyslar ro'yxati</h1>
            <div className="flex flex-1 justify-end items-center gap-3">
                {hasActiveFilters && (
                    <Button
                        onClick={clearAllFilters}
                        className="flex items-center gap-2 "
                    >
                        <X size={16} />
                        Filtrlarni tozalash
                    </Button>
                )}
                <ParamCombobox
                    paramName="driver"
                    options={driversData ?? []}
                    valueKey="id"
                    labelKey="first_name"
                    label="Haydovchilar"
                    className="w-full"
                    addButtonProps={{
                        className: "!bg-background dark:!bg-secondary",
                    }}
                />

                <ParamCombobox
                    paramName="vehicle"
                    options={vehicleData?.results ?? []}
                    valueKey="id"
                    labelKey="type"
                    label="Transportlar"
                    className="w-full"
                    addButtonProps={{
                        className: "!bg-background dark:!bg-secondary",
                    }}
                />

                <ParamDateRange
                    addButtonProps={{
                        className:
                            "!bg-background dark:!bg-secondary min-w-32 justify-start",
                    }}
                    from="from_date"
                    to="to_date"
                />

                {/* Clear Filters Button - Only show when filters are active */}
            </div>
        </div>
    )
}

export default TruckTripsHeader
