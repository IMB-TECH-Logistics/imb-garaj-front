import RolesPage from "@/pages/home/settings/roles"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/roles/")({
    component: RolesPage,
})
