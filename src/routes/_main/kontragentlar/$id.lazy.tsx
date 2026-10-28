import ContragentDetail from "@/pages/home/kontragent/detail"
import { createLazyFileRoute } from "@tanstack/react-router"

const ContragentDetailRoute = () => {
    const { id } = Route.useParams()
    return <ContragentDetail id={Number(id)} />
}

export const Route = createLazyFileRoute("/_main/kontragentlar/$id")({
    component: ContragentDetailRoute,
})
