import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_auth")({
    component: AuthLayout,
    beforeLoad: () => {
        const token = localStorage.getItem("token")
        if (token) {
            throw redirect({
                to: "/",
            })
        }
    },
})

function AuthLayout() {
    return <Outlet />
}
