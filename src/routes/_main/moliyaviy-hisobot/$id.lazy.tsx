import FinanceReportDetail from "@/pages/home/moliyaviy-hisobot/detail"
import { createLazyFileRoute } from "@tanstack/react-router"

const FinanceReportDetailRoute = () => {
    const { id } = Route.useParams()
    return <FinanceReportDetail id={Number(id)} />
}

export const Route = createLazyFileRoute("/_main/moliyaviy-hisobot/$id")({
    component: FinanceReportDetailRoute,
})
