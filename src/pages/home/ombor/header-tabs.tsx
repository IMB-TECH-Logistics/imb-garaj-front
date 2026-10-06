import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import type { OmborSearchParams } from "./types"

const OmborHeaderTabs = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { section } = useSearch({ strict: false }) as OmborSearchParams

    return (
        <Tabs
            className="hidden xl:flex overflow-x-auto custom-scrollbar max-w-full"
            value={section ?? "stock"}
            onValueChange={(value) =>
                navigate({
                    search: (prev: Record<string, unknown>) => ({
                        ...prev,
                        section: value === "stock" ? undefined : value,
                    }),
                } as never)
            }
        >
            <TabsList className="gap-2 bg-transparent">
                <TabsTrigger value="stock">{t("wh.tab_stock")}</TabsTrigger>
                <TabsTrigger value="moves">{t("wh.tab_moves")}</TabsTrigger>
            </TabsList>
        </Tabs>
    )
}

export default OmborHeaderTabs
