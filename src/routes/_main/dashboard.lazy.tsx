import { createLazyFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/dashboard")({
    component: () => <Navigate to="/truck" replace />,
})
