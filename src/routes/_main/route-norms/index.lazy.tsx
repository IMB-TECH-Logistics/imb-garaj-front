import RouteNormsPage from "@/pages/home/route-norms"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/route-norms/")({
    component: RouteNormsPage,
})
