import { useTranslation } from "react-i18next"
import type { WhProduct } from "./types"

export const LifeText = ({
    product,
}: {
    product: Pick<WhProduct, "life_years" | "life_months" | "life_days">
}) => {
    const { t } = useTranslation()
    const parts = [
        product.life_years ?
            t("wh.life_years", { count: product.life_years })
        :   "",
        product.life_months ?
            t("wh.life_months", { count: product.life_months })
        :   "",
        product.life_days ?
            t("wh.life_days", { count: product.life_days })
        :   "",
    ].filter(Boolean)

    if (!parts.length) {
        return (
            <span className="text-sm text-muted-foreground">
                {t("wh.no_expiry")}
            </span>
        )
    }
    return (
        <span className="tabular-nums whitespace-nowrap">
            {parts.join(" ")}
        </span>
    )
}
