import { createLazyFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/texnik-check/")({
    component: () => <Navigate to="/technic-check" replace />,
})
