import VehicleQueuePage from "@/pages/home/vehicle-queue"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/vehicle-queue/")({
    component: VehicleQueuePage,
})
