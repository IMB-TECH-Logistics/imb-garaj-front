import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import type { OmborSearchParams } from "./types"
import { useVstFinance } from "@/hooks/use-vst-finance"

const OmborHeaderTabs = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { section } = useSearch({ strict: false }) as OmborSearchParams
    const vst = useVstFinance()

    return (
        <Tabs
            className="hidden xl:flex overflow-x-auto custom-scrollbar max-w-full"
            value={section ?? "stock"}
            onValueChange={(value) =>
                navigate({
                    search: (prev: Record<string, unknown>) => ({
                        ...prev,
                        section: value === "stock" ? undefined : value,
                        page: undefined,
                        tenant: undefined,
                        direction: undefined,
                    }),
                } as never)
            }
        >
            <TabsList className="gap-2 bg-transparent">
                <TabsTrigger value="stock">{t("wh.tab_stock")}</TabsTrigger>
                <TabsTrigger value="moves">{t("wh.tab_moves")}</TabsTrigger>
                {vst ?
                    <>
                        <TabsTrigger value="suppliers">{t("suppliers.title")}</TabsTrigger>
                        <TabsTrigger value="catalog">{t("wh.catalog")}</TabsTrigger>
                        <TabsTrigger value="units">{t("wh.units")}</TabsTrigger>
                    </>
                :   <>
                        <TabsTrigger value="others">{t("wh.tab_others")}</TabsTrigger>
                        <TabsTrigger value="transfers">{t("wh.tab_transfers")}</TabsTrigger>
                        <TabsTrigger value="debts">{t("wh.tab_debts")}</TabsTrigger>
                    </>
                }
            </TabsList>
        </Tabs>
    )
}

export default OmborHeaderTabs
