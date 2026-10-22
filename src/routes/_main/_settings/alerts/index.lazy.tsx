import AlertSettingsPage from "@/pages/home/settings/alerts"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/alerts/")({
    component: AlertSettingsPage,
})
