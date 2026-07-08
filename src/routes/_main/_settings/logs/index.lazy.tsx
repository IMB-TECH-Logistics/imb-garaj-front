import LogsPage from "@/pages/home/settings/logs"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/logs/")({
    component: LogsPage,
})
