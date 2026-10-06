import ParamTabs from "@/components/as-params/tabs"
import { useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import UnitsPage from "../units"
import ProductCatalogPage from "."

const ProductSettingsPage = () => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as Record<string, unknown>
    const tab = search.tab === "units" ? "units" : "products"

    return (
        <div className="flex flex-col w-full gap-3">
            <ParamTabs
                paramName="tab"
                dontCleanOthers={false}
                options={[
                    { value: "products", label: t("wh.catalog") },
                    { value: "units", label: t("wh.units") },
                ]}
            />
            {tab === "units" ? <UnitsPage /> : <ProductCatalogPage />}
        </div>
    )
}

export default ProductSettingsPage
