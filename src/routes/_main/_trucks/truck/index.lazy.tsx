import FinanceStatisticMain from "@/pages/home/finance/finance-main"
import { createLazyFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

const TruckRoute = () => {
    const { t } = useTranslation()
    return (
        <>
            <h1 className="sr-only">{t("nav.vehicles")}</h1>
            <FinanceStatisticMain />
        </>
    )
}

export const Route = createLazyFileRoute("/_main/_trucks/truck/")({
    component: TruckRoute,
})
