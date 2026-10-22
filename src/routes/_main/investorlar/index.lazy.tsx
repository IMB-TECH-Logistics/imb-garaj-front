import InvestorDashboard from "@/pages/home/investor-dashboard"
import { createLazyFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

const InvestorDashboardRoute = () => {
    const { t } = useTranslation()
    return (
        <>
            <h1 className="sr-only">{t("nav.investor_dashboard")}</h1>
            <InvestorDashboard />
        </>
    )
}

export const Route = createLazyFileRoute("/_main/investorlar/")({
    component: InvestorDashboardRoute,
})
