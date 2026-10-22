import PassportPage from "@/pages/home/texnik-baza/passport"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/texnik-baza/$id")({
    component: PassportPage,
})
