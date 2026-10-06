import ParamTabs from "@/components/as-params/tabs"
import { useTranslation } from "react-i18next"
import UnitsPage from "../units"
import ProductCatalogPage from "."

const ProductSettingsPage = () => {
    const { t } = useTranslation()

    return (
        <ParamTabs
            paramName="tab"
            dontCleanOthers={false}
            className="mb-4"
            options={[
                {
                    value: "products",
                    label: t("wh.catalog"),
                    content: <ProductCatalogPage />,
                },
                {
                    value: "units",
                    label: t("wh.units"),
                    content: <UnitsPage />,
                },
            ]}
        />
    )
}

export default ProductSettingsPage
