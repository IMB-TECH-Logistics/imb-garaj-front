import UsersPage from "@/pages/home/settings/users"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/users/")({
    component: UsersPage,
})
