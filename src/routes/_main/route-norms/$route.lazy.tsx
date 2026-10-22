import RouteNormOrdersPage from "@/pages/home/route-norms/orders-page"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/route-norms/$route")({
    component: RouteNormOrdersPage,
})
