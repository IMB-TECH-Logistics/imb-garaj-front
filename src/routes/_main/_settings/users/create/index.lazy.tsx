import UserFormPage from "@/pages/home/settings/users/user-form-page"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/users/create/")({
    component: UserFormPage,
})
