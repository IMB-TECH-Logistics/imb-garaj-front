import { useTranslation } from "react-i18next"
import { ParamCombobox } from "@/components/as-params/combobox"
import { ParamMultiCombobox } from "@/components/as-params/multi-combobox"
import { useCodes } from "@/constants/useCodes"
import { useRegionsFilter } from "@/constants/useSelectableFilter"
import { formatMoney } from "@/lib/format-money"
import { ReactNode } from "react"
import ParamDateRange from "../as-params/date-picker-range"
import ParamPagination from "../as-params/pagination"
import { Badge } from "../ui/badge"
import FilterClearButton from "./filter-clear-button"

type Props = {
    count?: number
    totalPages?: number
    isFetching?: boolean
    rightComponent?: ReactNode
    isRanchParam?: boolean
}

const OrdersFilterHeader = ({
    count,
    totalPages,
    isFetching = false,
    rightComponent = null,
    isRanchParam = false,
}: Props) => {
    const { codes } = useCodes()
    const { regions } = useRegionsFilter()
    const { t } = useTranslation()

    return (
        <div className="flex items-center justify-between gap-6 mb-3">
            <div className="flex items-center gap-3">
                <div className="flex  gap-2">
                    <p className="text-xl">{t("ui.list.count")}</p>
                    <Badge>{formatMoney(count)}</Badge>
                </div>
                <ParamMultiCombobox
                    options={codes}
                    paramName="codes"
                    label={t("ui.orders_filter.firm_code")}
                    className="w-max"
                    labelKey="label"
                    valueKey="value"
                    addButtonProps={{
                        className: "min-w-36",
                    }}
                />
                <ParamCombobox
                    options={regions || []}
                    paramName="loading"
                    label={t("ui.orders_filter.from")}
                />
                <ParamCombobox
                    options={regions || []}
                    paramName="unloading"
                    label={t("ui.orders_filter.to")}
                />
                <div>
                    {isRanchParam && <ParamDateRange className="min-w-32" />}
                </div>
                <div>
                    <FilterClearButton />
                </div>
            </div>
            {rightComponent}
            {totalPages && count && count > 25 && (
                <ParamPagination
                    disabled={isFetching}
                    totalPages={totalPages}
                />
            )}
        </div>
    )
}

export default OrdersFilterHeader
