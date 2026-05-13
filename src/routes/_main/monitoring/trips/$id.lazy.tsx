import TripTrackPage from "@/pages/home/monitoring/trip-track"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/monitoring/trips/$id")({
    component: TripTrackPage,
})
