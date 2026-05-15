import { COMMON_DIRECTIONS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useMemo } from "react"

type Direction = {
    load: number
    load_name: string
    unload: number
    unload_name: string
}

export type DistrictOption = { id: number; name: string }

const distinctOptions = (
    rows: Direction[],
    picker: (d: Direction) => DistrictOption,
): DistrictOption[] => {
    const seen = new Set<number>()
    const out: DistrictOption[] = []
    for (const row of rows) {
        const { id, name } = picker(row)
        if (id === undefined || id === null || seen.has(id)) continue
        seen.add(id)
        out.push({ id, name })
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Loading/unloading places come from configured routes, not the
 * `selectable/district` endpoint (which returns no data for this view).
 */
export const useLoadingPlaces = (enabled = true) => {
    const { data } = useGet<ListResponse<Direction>>(COMMON_DIRECTIONS, {
        params: { page_size: 10000 },
        enabled,
    })

    const directions = useMemo(() => data?.results ?? [], [data])

    const loadingOptions = useMemo(
        () =>
            distinctOptions(directions, (d) => ({
                id: d.load,
                name: d.load_name,
            })),
        [directions],
    )

    const unloadingOptions = useMemo(
        () =>
            distinctOptions(directions, (d) => ({
                id: d.unload,
                name: d.unload_name,
            })),
        [directions],
    )

    return { loadingOptions, unloadingOptions }
}
