import FinanceReportDetail from "@/pages/home/moliyaviy-hisobot/detail"
import { FinReportGuard } from "@/pages/home/moliyaviy-hisobot/guard"
import { createLazyFileRoute } from "@tanstack/react-router"

const FinanceReportDetailRoute = () => {
    const { id } = Route.useParams()
    return (
        <FinReportGuard>
            <FinanceReportDetail id={Number(id)} />
        </FinReportGuard>
    )
}

export const Route = createLazyFileRoute("/_main/moliyaviy-hisobot/$id")({
    component: FinanceReportDetailRoute,
})
