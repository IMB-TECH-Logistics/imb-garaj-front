import FlightsPage from "@/pages/home/flights"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_managers/flights/")({
    component: FlightsPage,
})
