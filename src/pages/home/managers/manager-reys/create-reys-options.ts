import { useTranslation } from "react-i18next"

export type Option = { id: number; name: string }

export type StatusOption = { id: string; name: string }

export const useStatusOptions = (): StatusOption[] => {
    const { t } = useTranslation()
    return [
        { id: "0", name: t("status.pending") },
        { id: "1", name: t("status.started") },
        { id: "5", name: t("status.loading_status") },
        { id: "6", name: t("status.on_road") },
        { id: "7", name: t("status.unloading_status") },
        { id: "2", name: t("status.done") },
        { id: "3", name: t("status.cancelled") },
    ]
}

export const useActivityOptions = (): StatusOption[] => {
    const { t } = useTranslation()
    return [
        { id: "1", name: t("nav.flights") },
        { id: "2", name: t("status.in_garage") },
        { id: "3", name: t("status.repair") },
        { id: "4", name: t("status.idle_stop") },
        { id: "5", name: t("status.in_queue") },
    ]
}

export type Direction = {
    id: number
    owner: number
    owner_name: string
    load: number
    load_name: string
    unload: number
    unload_name: string
    cargo_type: number
    cargo_type_name: string
    payment_type: number
    amount: string | null
    load_place_display?: string | null
    unload_place_display?: string | null
    no_price?: boolean
}

export const distinctOptions = (
    rows: Direction[],
    picker: (d: Direction) => { id: number; name: string },
): Option[] => {
    const seen = new Set<number>()
    const out: Option[] = []
    for (const row of rows) {
        const { id, name } = picker(row)
        if (seen.has(id)) continue
        seen.add(id)
        out.push({ id, name })
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
}
