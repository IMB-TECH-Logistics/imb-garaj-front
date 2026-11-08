import { useMemo } from "react"
import { FormCombobox } from "@/components/form/combobox"
import { useGet } from "@/hooks/useGet"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useTranslation } from "react-i18next"

// ──── Petrol station picker (used in fuel expense) ────

export type PetrolStationOption = {
    id: number
    name: string
    address: string
    balance: string | number | null
    is_cash?: boolean
}

export function PetrolStationField({
    control,
    current,
}: {
    control: any
    current?: { id: number | null | undefined; name: string | null | undefined }
}) {
    const { t } = useTranslation()
    const { data } = useGet<ListResponse<PetrolStationOption>>(
        SETTINGS_PETROL_STATIONS,
        { params: { page_size: 1000 } },
    )
    const options = useMemo(() => {
        const list = (data?.results ?? [])
            .slice()
            .sort((a, b) => Number(!!b.is_cash) - Number(!!a.is_cash))
            .map((p) => ({ id: p.id, name: p.name }))
        if (current?.id && !list.some((o) => o.id === current.id)) {
            list.unshift({ id: current.id, name: current.name || `#${current.id}` })
        }
        return list
    }, [data, current?.id, current?.name])
    return (
        <FormCombobox
            control={control}
            label={t("nav.petrol")}
            name="petrol_station"
            options={options}
            valueKey="id"
            labelKey="name"
            placeholder={t("settings.petrol.cash_default")}
        />
    )
}
