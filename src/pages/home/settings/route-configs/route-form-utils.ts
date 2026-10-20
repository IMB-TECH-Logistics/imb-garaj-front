
export type DirectionPrice = {
    id: number
    price: string | number
    valid_from: string
}

export type Direction = {
    id?: number
    owner: number | null
    load: number | null
    unload: number | null
    load_place?: string | null
    unload_place?: string | null
    cargo_type: number | null
    payment_type: number | null
    distributor_id: number | null
    distributor_name?: string | null
    distributor_code?: string | null
    distributor_district?: string | null
    price: string | null
    currency?: number
    valid_from: string | null
    current_price?: DirectionPrice | null
    prices?: DirectionPrice[]
    owner_name?: string
    load_name?: string
    unload_name?: string
    cargo_type_name?: string
}

export type SelectItem = { id: number | string; name: string }

export type DistributorOption = {
    id: number
    name: string
    code: string | null
    district_name: string | null
}

export const distributorLabel = (name?: string | null, code?: string | null, district?: string | null) =>
    [name, code ? `(${code})` : null, district ? `— ${district}` : null].filter(Boolean).join(" ")

export const withCurrent = (
    options: SelectItem[] | undefined,
    id: number | null | undefined,
    name?: string,
    deletedLabel?: string,
): SelectItem[] => {
    const list = options ?? []
    if (id == null || list.some((o) => String(o.id) === String(id))) {
        return list
    }
    return [{ id, name: name ? `${name} (${deletedLabel})` : `#${id}` }, ...list]
}
