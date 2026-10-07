import { ParamCombobox } from "@/components/as-params/combobox"
import ParamDateRange from "@/components/as-params/date-picker-range"
import { Button } from "@/components/ui/button"
import {
    SETTINGS_SELECTABLE_CARGO_TYPE,
    SETTINGS_SELECTABLE_CLIENT,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { X } from "lucide-react"
import { ACTIVITY_OPTIONS } from "./create-reys"
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
    "is_integration",
    "from_date",
    "to_date",
] as const

const filterButtonProps = {
    className: "w-auto gap-2 whitespace-nowrap font-normal !bg-background dark:!bg-secondary",
}

export default function ReysFilters({ trailing }: { trailing?: React.ReactNode } = {}) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search = useSearch({ strict: false }) as Record<string, any>


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
        <div className="flex flex-wrap items-center justify-end gap-2">
            {hasActiveFilters && (
                <Button onClick={clearAllFilters} className="flex items-center gap-2">
                    <X size={16} />
                    {t("page.clear_filters")}
                </Button>
            )}
            <ParamCombobox
                paramName="activity"
                label={t("table.activity")}
                options={ACTIVITY_OPTIONS}
                valueKey="id"
                labelKey="name"
                isSearch={false}
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
            <ParamDateRange
                from="from_date"
                to="to_date"
                addButtonProps={{ className: "w-auto gap-2 whitespace-nowrap justify-start !bg-background dark:!bg-secondary" }}
            />
            {trailing}
        </div>
    )
}
