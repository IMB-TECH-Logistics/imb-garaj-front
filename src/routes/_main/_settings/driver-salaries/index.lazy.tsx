import DriverSalariesPage from "@/pages/home/settings/driver-salaries"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/driver-salaries/")({
    component: DriverSalariesPage,
})
