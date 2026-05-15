import { MANAGERS_RUNS_FILTER_OPTIONS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useMemo } from "react"

export type SelectOption = { id: number; name: string; code?: string }
export type StatusOption = { value: number; label: string }

type RunFilterOptions = {
    loading: SelectOption[]
    unloading: SelectOption[]
    client: SelectOption[]
    cargo_type: SelectOption[]
    vehicle: SelectOption[]
    trip: SelectOption[]
    driver: SelectOption[]
    status: StatusOption[]
}

type ScopeParams = {
    from_date?: string
    to_date?: string
    search?: string
    enabled?: boolean
}

const EMPTY: SelectOption[] = []

export const useRunFilterOptions = (scope: ScopeParams) => {
    const { data } = useGet<RunFilterOptions>(MANAGERS_RUNS_FILTER_OPTIONS, {
        enabled: scope.enabled ?? true,
        params: {
            from_date: scope.from_date,
            to_date: scope.to_date,
            search: scope.search,
        },
    })

    return useMemo(
        () => ({
            loadingOptions: data?.loading ?? EMPTY,
            unloadingOptions: data?.unloading ?? EMPTY,
            clientOptions: data?.client ?? EMPTY,
            cargoTypeOptions: data?.cargo_type ?? EMPTY,
            vehicleOptions: data?.vehicle ?? EMPTY,
            tripOptions: data?.trip ?? EMPTY,
            driverOptions: data?.driver ?? EMPTY,
            statusOptions: data?.status ?? [],
        }),
        [data],
    )
}
