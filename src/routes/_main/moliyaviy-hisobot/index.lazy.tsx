import FinanceReportsPage from "@/pages/home/moliyaviy-hisobot"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/moliyaviy-hisobot/")({
    component: FinanceReportsPage,
})
