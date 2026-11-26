import FinanceReportsPage from "@/pages/home/moliyaviy-hisobot"
import { FinReportGuard } from "@/pages/home/moliyaviy-hisobot/guard"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/moliyaviy-hisobot/")({
    component: () => (
        <FinReportGuard>
            <FinanceReportsPage />
        </FinReportGuard>
    ),
})
