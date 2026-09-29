import { createLazyFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_managers/transports/")({
    component: () => <Navigate to="/truck" replace />,
})
