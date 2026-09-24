import Drivers from "@/pages/home/settings/driver"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/drivers/")({
    component: Drivers,
})
