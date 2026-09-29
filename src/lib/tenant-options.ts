import { isAllTenantsMode } from "@/lib/tenant-scope"

type Loose = Record<string, any>

export type NameGroup = {
    key: string
    label: string
    ids: Record<string, string[]>
    first: Loose
}

const hasTenantInfo = (option: Loose | null | undefined) =>
    !!option && (!!option.tenant_ids || !!option.tenant_schema)

const optionIds = (
    option: Loose,
    valueKey: PropertyKey,
): Record<string, string[]> | null => {
    if (option.tenant_ids && typeof option.tenant_ids === "object") {
        const result: Record<string, string[]> = {}
        Object.entries(option.tenant_ids).forEach(([schema, value]) => {
            const list = Array.isArray(value) ? value : [value]
            result[schema] = list.map(String)
        })
        return result
    }
    const value = option[valueKey as string]
    if (option.tenant_schema && value !== undefined && value !== null) {
        return { [option.tenant_schema]: [String(value)] }
    }
    return null
}

export const groupOptionsByName = (
    options: Loose[] | undefined,
    labelKey: PropertyKey,
    valueKey: PropertyKey,
): NameGroup[] | null => {
    if (!isAllTenantsMode() || !Array.isArray(options)) return null
    if (!options.some(hasTenantInfo)) return null

    const groups = new Map<string, NameGroup>()
    options.forEach((option) => {
        if (!hasTenantInfo(option)) return
        const ids = optionIds(option, valueKey)
        const label = String(option[labelKey as string] ?? "").trim()
        if (!ids || !label) return
        const key = label.toLowerCase()
        let group = groups.get(key)
        if (!group) {
            group = { key, label, ids: {}, first: option }
            groups.set(key, group)
        }
        Object.entries(ids).forEach(([schema, list]) => {
            const current = group!.ids[schema] ?? []
            group!.ids[schema] = [...new Set([...current, ...list])]
        })
    })
    return [...groups.values()]
}

const encodeScoped = (map: Record<string, string>) => {
    const sorted: Record<string, string> = {}
    Object.keys(map)
        .sort()
        .forEach((schema) => {
            sorted[schema] = map[schema]
        })
    return "@" + JSON.stringify(sorted)
}

export const encodeSingle = (group: NameGroup) => {
    const map: Record<string, string> = {}
    Object.entries(group.ids).forEach(([schema, list]) => {
        if (list.length) map[schema] = list[0]
    })
    return encodeScoped(map)
}

export const decodeScoped = (value: unknown): Record<string, string> => {
    if (typeof value !== "string" || !value.startsWith("@")) return {}
    try {
        const parsed = JSON.parse(value.slice(1))
        if (!parsed || typeof parsed !== "object") return {}
        const result: Record<string, string> = {}
        Object.entries(parsed).forEach(([schema, ids]) => {
            result[schema] = String(ids)
        })
        return result
    } catch {
        return {}
    }
}

const isGroupSelected = (
    group: NameGroup,
    decoded: Record<string, string>,
) => {
    const entries = Object.entries(group.ids)
    return (
        entries.length > 0 &&
        entries.every(([schema, list]) => {
            const current = (decoded[schema] ?? "").split(",")
            return list.every((id) => current.includes(id))
        })
    )
}

export const selectedGroupKeys = (groups: NameGroup[], value: unknown) => {
    const decoded = decodeScoped(value)
    return groups
        .filter((group) => isGroupSelected(group, decoded))
        .map((group) => group.key)
}

export const toggleGroup = (
    value: unknown,
    group: NameGroup,
): string | undefined => {
    const decoded = decodeScoped(value)
    const selected = isGroupSelected(group, decoded)
    const next: Record<string, string[]> = {}
    Object.entries(decoded).forEach(([schema, ids]) => {
        next[schema] = ids ? ids.split(",") : []
    })
    Object.entries(group.ids).forEach(([schema, ids]) => {
        const current = next[schema] ?? []
        next[schema] =
            selected ?
                current.filter((id) => !ids.includes(id))
            :   [...new Set([...current, ...ids])]
    })
    const map: Record<string, string> = {}
    Object.entries(next).forEach(([schema, ids]) => {
        if (ids.length) map[schema] = ids.join(",")
    })
    return Object.keys(map).length ? encodeScoped(map) : undefined
}

export const groupsToValue = (groups: NameGroup[]): string | undefined => {
    const next: Record<string, string[]> = {}
    groups.forEach((group) => {
        Object.entries(group.ids).forEach(([schema, ids]) => {
            next[schema] = [...new Set([...(next[schema] ?? []), ...ids])]
        })
    })
    const map: Record<string, string> = {}
    Object.entries(next).forEach(([schema, ids]) => {
        map[schema] = ids.join(",")
    })
    return Object.keys(map).length ? encodeScoped(map) : undefined
}
