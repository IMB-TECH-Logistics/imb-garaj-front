import StatusReport from "@/pages/home/monitoring/status"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/monitoring/status")({
    component: StatusReport,
})
