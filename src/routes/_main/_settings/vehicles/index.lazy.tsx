import VehiclesPage from "@/pages/home/settings/vehicles"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/vehicles/")({
    component: VehiclesPage,
})
