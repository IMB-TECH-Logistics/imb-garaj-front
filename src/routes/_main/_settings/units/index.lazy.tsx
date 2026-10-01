import UnitsPage from "@/pages/home/settings/units"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/units/")({
    component: UnitsPage,
})
