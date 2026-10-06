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
            className="mb-4 h-8 gap-0.5 p-0.5"
            options={[
                {
                    value: "products",
                    label: t("wh.catalog"),
                    content: <ProductCatalogPage />,
                    className: "px-2.5 py-1 text-[13px]",
                },
                {
                    value: "units",
                    label: t("wh.units"),
                    content: <UnitsPage />,
                    className: "px-2.5 py-1 text-[13px]",
                },
            ]}
        />
    )
}

export default ProductSettingsPage
