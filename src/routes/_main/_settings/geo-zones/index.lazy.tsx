import GeoZonesPage from "@/pages/home/settings/geo-zones"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/geo-zones/")({
    component: GeoZonesPage,
})
