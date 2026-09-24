import { ParamCombobox } from "@/components/as-params/combobox"
import { Button } from "@/components/ui/button"
import {
    SETTINGS_SELECTABLE_CARGO_TYPE,
    SETTINGS_SELECTABLE_CLIENT,
    SETTINGS_SELECTABLE_REGION,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { X } from "lucide-react"
import { ACTIVITY_OPTIONS, STATUS_OPTIONS } from "./create-reys"
import { useTranslation } from "react-i18next"

type Option = { id: number | string; name: string }

export const REYS_FILTER_KEYS = [
    "search",
    "loading",
    "unloading",
    "cargo_type",
    "client",
    "activity",
    "type",
    "status",
    "out_of_contract",
    "from_date",
    "to_date",
] as const

const CONTRACT_OPTIONS: Option[] = [
    { id: "false", name: "Shartnoma bo'yicha" },
    { id: "true", name: "Shartnomadan tashqari" },
]

const LIST_STATUS_OPTIONS = STATUS_OPTIONS.filter((option) => option.id !== "4")

const filterButtonProps = {
    className: "!bg-background dark:!bg-secondary",
}

export default function ReysFilters() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search = useSearch({ strict: false }) as Record<string, any>

    const TYPE_OPTIONS: Option[] = [
        { id: "1", name: t("status.loaded") },
        { id: "2", name: t("status.empty") },
    ]

    const { data: regions } = useGet<Option[]>(SETTINGS_SELECTABLE_REGION)
    const { data: cargoTypes } = useGet<Option[]>(SETTINGS_SELECTABLE_CARGO_TYPE, {
        params: { model_name: "cargo-type" },
    })
    const { data: clients } = useGet<Option[]>(SETTINGS_SELECTABLE_CLIENT, {
        params: { model_name: "client" },
    })

    const hasActiveFilters = REYS_FILTER_KEYS.some(
        (key) => search[key] !== undefined && search[key] !== "",
    )

    const clearAllFilters = () => {
        navigate({
            search: {
                ...search,
                ...Object.fromEntries(REYS_FILTER_KEYS.map((key) => [key, undefined])),
                page: undefined,
            },
        } as any)
    }
    return (
        <div className="mt-3 flex flex-col gap-2">
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={clearAllFilters} className="flex items-center gap-2">
                        <X size={16} />
                        {t("page.clear_filters")}
                    </Button>
                </div>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                <ParamCombobox
                    paramName="loading"
                    label={t("form.loading_location")}
                    options={regions ?? []}
                    valueKey="id"
                    labelKey="name"
                    addButtonProps={filterButtonProps}
                />
                <ParamCombobox
                    paramName="unloading"
                    label={t("form.unloading_location")}
                    options={regions ?? []}
                    valueKey="id"
                    labelKey="name"
                    addButtonProps={filterButtonProps}
                />
                <ParamCombobox
                    paramName="cargo_type"
                    label={t("form.cargo_type")}
                    options={cargoTypes ?? []}
                    valueKey="id"
                    labelKey="name"
                    addButtonProps={filterButtonProps}
                />
                <ParamCombobox
                    paramName="client"
                    label={t("form.cargo_owner")}
                    options={clients ?? []}
                    valueKey="id"
                    labelKey="name"
                    addButtonProps={filterButtonProps}
                />
                <ParamCombobox
                    paramName="activity"
                    label={t("table.status")}
                    options={ACTIVITY_OPTIONS}
                    valueKey="id"
                    labelKey="name"
                    isSearch={false}
                    addButtonProps={filterButtonProps}
                />
                <ParamCombobox
                    paramName="type"
                    label={t("table.status")}
                    options={TYPE_OPTIONS}
                    valueKey="id"
                    labelKey="name"
                    isSearch={false}
                    addButtonProps={filterButtonProps}
                />
                <ParamCombobox
                    paramName="status"
                    label={t("table.status")}
                    options={LIST_STATUS_OPTIONS}
                    valueKey="id"
                    labelKey="name"
                    isSearch={false}
                    addButtonProps={filterButtonProps}
                />
                <ParamCombobox
                    paramName="out_of_contract"
                    label={t("form.contract")}
                    options={CONTRACT_OPTIONS}
                    valueKey="id"
                    labelKey="name"
                    isSearch={false}
                    addButtonProps={filterButtonProps}
                />
            </div>
        </div>
    )
}
