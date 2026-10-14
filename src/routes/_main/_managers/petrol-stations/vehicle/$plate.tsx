import VehicleFuelDetailPage from "@/pages/home/settings/petrol-stations/vehicle-fuel-detail"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_main/_managers/petrol-stations/vehicle/$plate")({
    component: VehicleFuelDetailPage,
})
