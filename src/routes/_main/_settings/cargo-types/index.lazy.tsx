import CargoPage from "@/pages/home/settings/cargo-types"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/cargo-types/")({
    component: CargoPage,
})
