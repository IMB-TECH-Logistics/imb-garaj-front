import RouteConfigsPage from "@/pages/home/settings/route-configs"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/route-configs/")({
    component: RouteConfigsPage,
})
