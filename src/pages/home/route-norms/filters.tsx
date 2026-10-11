import { ParamCombobox } from "@/components/as-params/combobox"
import ParamDateRange, {
    isReversedRange,
    useDefaultRangeApplied,
} from "@/components/as-params/date-picker-range"
import ParamInput from "@/components/as-params/input"
import DownloadAsExcel from "@/components/download-as-excel"
import FilterClearButton from "@/components/shared/filter-clear-button"
import { MONITORING_ROUTE_NORMS_EXCEL } from "@/constants/api-endpoints"
import { useSearch } from "@tanstack/react-router"
import { subDays } from "date-fns"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useRunFilterOptions } from "../buxgalteriya/loading-options"

export type RouteNormFilterParams = {
    from_date?: string
    to_date?: string
    fuel_type?: string
    vehicle?: string
    driver?: string
    search?: string
}

const CLEAR_KEYS = ["fuel_type", "vehicle", "driver", "search", "page"]

const comboStyle = {
    className: "!bg-background dark:!bg-secondary min-w-40 justify-start",
}

export const useRouteNormFilters = () => {
    const search: any = useSearch({ strict: false })
    const rangeApplied = useDefaultRangeApplied()
    const isReversed = isReversedRange(search?.from_date, search?.to_date)

    const params = useMemo<RouteNormFilterParams>(
        () => ({
            from_date: search?.from_date || undefined,
            to_date: search?.to_date || undefined,
            fuel_type: search?.fuel_type || undefined,
            vehicle: search?.vehicle || undefined,
            driver: search?.driver || undefined,
            search: search?.search || undefined,
        }),
        [
            search?.from_date,
            search?.to_date,
            search?.fuel_type,
            search?.vehicle,
            search?.driver,
            search?.search,
        ],
    )

    return { params, ready: rangeApplied && !isReversed }
}

type Props = {
    params: RouteNormFilterParams
    ordering?: string
    ready: boolean
}

export default function RouteNormFilters({ params, ordering, ready }: Props) {
    const { t } = useTranslation()

    const { vehicleOptions, driverOptions } = useRunFilterOptions({
        from_date: params.from_date,
        to_date: params.to_date,
        enabled: ready,
    })

    const fuelOptions = useMemo(
        () => [
            { id: "diesel", name: t("route_norms.fuel_types.diesel") },
            { id: "methane", name: t("route_norms.fuel_types.methane") },
        ],
        [t],
    )

    const defaultRange = useMemo(() => {
        const today = new Date()
        return { from: subDays(today, 29), to: today }
    }, [])

    return (
        <div className="flex items-center justify-end gap-2 flex-wrap mb-3">
            <ParamDateRange
                from="from_date"
                to="to_date"
                defaultValue={defaultRange}
                addButtonProps={{
                    className:
                        "!bg-background dark:!bg-secondary min-w-44 justify-start",
                }}
            />
            <ParamCombobox
                paramName="fuel_type"
                options={fuelOptions}
                label={t("route_norms.filters.fuel_type")}
                isSearch={false}
                addButtonProps={comboStyle}
            />
            <ParamCombobox
                paramName="vehicle"
                options={vehicleOptions}
                label={t("route_norms.filters.vehicle")}
                addButtonProps={comboStyle}
            />
            <ParamCombobox
                paramName="driver"
                options={driverOptions}
                label={t("route_norms.filters.driver")}
                addButtonProps={comboStyle}
            />
            <ParamInput
                placeholder={t("route_norms.filters.search")}
                wrapperClassName="!w-52"
            />
            <FilterClearButton keys={CLEAR_KEYS} />
            <DownloadAsExcel
                url={MONITORING_ROUTE_NORMS_EXCEL}
                name={t("route_norms.excel_name")}
                params={{ ...params, ordering }}
            >
                {t("actions.download")}
            </DownloadAsExcel>
        </div>
    )
}
