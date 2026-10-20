import {
    COMMON_DIRECTIONS_DISTRIBUTORS,
    SETTINGS_SELECTABLE_CARGO_TYPE,
    SETTINGS_SELECTABLE_CLIENT,
    SETTINGS_SELECTABLE_PAYMENT_TYPE,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import type { TFunction } from "i18next"
import { Direction, DistributorOption, distributorLabel, SelectItem, withCurrent } from "./route-form-utils"

export const useRouteOptions = (current: Direction | undefined, t: TFunction) => {
    const { data: clientData } = useGet<SelectItem[]>(SETTINGS_SELECTABLE_CLIENT, {
        params: { model_name: "client" },
    })
    const { data: regionsData } = useGet<SelectItem[]>("selectable/region", {
        params: { model_name: "region" },
    })
    const { data: cargoType } = useGet<SelectItem[]>(SETTINGS_SELECTABLE_CARGO_TYPE, {
        params: { model_name: "cargo-type" },
    })
    const { data: paymentType } = useGet<SelectItem[]>(SETTINGS_SELECTABLE_PAYMENT_TYPE, {
        params: { model_name: "payment-type" },
    })
    const { data: distributorsData } = useGet<DistributorOption[]>(COMMON_DIRECTIONS_DISTRIBUTORS)
    const deletedLabel = t("settings.common.deleted_lower")
    const distributorOptions = withCurrent(
        distributorsData?.map((d) => ({ id: d.id, name: distributorLabel(d.name, d.code, d.district_name) })),
        current?.distributor_id,
        current?.distributor_name
            ? distributorLabel(current.distributor_name, current.distributor_code, current.distributor_district)
            : undefined,
        deletedLabel,
    )
    return { clientData, regionsData, cargoType, paymentType, deletedLabel, distributorOptions }
}
