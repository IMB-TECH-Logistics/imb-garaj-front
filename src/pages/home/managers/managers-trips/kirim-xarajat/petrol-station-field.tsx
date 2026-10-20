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

export function PetrolStationField({ control }: { control: any }) {
    const { t } = useTranslation()
    const { data } = useGet<ListResponse<PetrolStationOption>>(
        SETTINGS_PETROL_STATIONS,
        { params: { page_size: 1000 } },
    )
    const formatBalance = (n: number) =>
        Math.round(n)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    const options = useMemo(
        () =>
            (data?.results ?? [])
                .slice()
                .sort((a, b) => Number(!!b.is_cash) - Number(!!a.is_cash))
                .map((p) => ({
                id: p.id,
                name: t("trips.kirim.station_balance", { name: p.name, balance: formatBalance(Number(p.balance ?? 0)) }),
            })),
        [data, t],
    )
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
