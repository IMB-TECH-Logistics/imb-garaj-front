import InvestorDetail from "@/pages/home/investors/detail"
import { createLazyFileRoute } from "@tanstack/react-router"

const InvestorDetailRoute = () => {
    const { id } = Route.useParams()
    return <InvestorDetail id={Number(id)} />
}

export const Route = createLazyFileRoute("/_main/investor-royxati/$id")({
    component: InvestorDetailRoute,
})
