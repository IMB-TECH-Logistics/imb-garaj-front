import GarageAreasPage from "@/pages/home/settings/garage-areas"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/garage-areas/")({
    component: GarageAreasPage,
})
