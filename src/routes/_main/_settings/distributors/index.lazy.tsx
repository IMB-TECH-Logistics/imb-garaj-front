import Distributors from "@/pages/home/settings/distributors"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/distributors/")({
    component: Distributors,
})
