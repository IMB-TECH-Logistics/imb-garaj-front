import VehicleTypePage from "@/pages/home/settings/vehicle-types"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/vehicle-types/")({
    component: VehicleTypePage,
})
