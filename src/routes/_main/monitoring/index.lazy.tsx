import MonitoringPage from "@/pages/home/monitoring"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/monitoring/")({
    component: MonitoringPage,
})
