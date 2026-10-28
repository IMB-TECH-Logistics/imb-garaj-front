import InvestorsPage from "@/pages/home/investors"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/investor-royxati/")({
    component: InvestorsPage,
})
